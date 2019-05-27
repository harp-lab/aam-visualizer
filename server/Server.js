const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const child_process = require('child_process');
const Consts = require('./Consts.js');
const G = require('./Global.js');
const Project = require('./Project.js');

class Server {
  constructor() {
    this.projects = {};
    this.initData();
    this.initServer();
    this.initWatcher();
  }
  initServer() {
    const app = express();
    const port = 8086;
    
    app.use(express.json());
    app.use(express.static(path.join(__dirname, '../build')));
    
    app.get('/api/all', (req, res) => {
      res.json(this.getProjectList())
        .status(200)
        .end();
    });
    app.get('/api/create', (req, res) => {
      const projectId = this.createProject();
      res.json({ id: projectId })
        .status(201)
        .end();
    });
    
    const projectRouter = express.Router({ mergeParams: true });
    projectRouter.get('/:id/code', (req, res) => {
      const projectId = req.params.id;
      const project = this.projects[projectId];
      res.json({ id: projectId, code: project.code })
        .status(200)
        .end();
    });
    projectRouter.get('/:id/data', (req, res) => {
      const projectId = req.params.id;
      const project = this.projects[projectId];
      switch (project.status) {
        case project.STATUSES.done:
        case project.STATUSES.error:
          res.json({
            id: projectId,
            graphs: project.getGraphs(),
            code: project.code,
            status: project.status
          })
            .status(200)
            .end();
          break;
        case project.STATUSES.process:
          res.status(204).end();
          break;
        default:
          res.status(412).end();
          break;
      }
    });
    projectRouter.put('/:id/save', (req, res) => {
      const projectId = req.params.id;
      const data = req.body;
      this.saveProject(projectId, data);
      res.status(202).end();
    });
    projectRouter.put('/:id/process', (req, res) => {
      const projectId = req.params.id;
      const project = this.projects[projectId];
      const options = req.body;
      project.analysis = options.analysis;
      this.processProject(projectId);
      res.status(200).end();
    });
    projectRouter.put('/:id/delete', (req, res) => {
      this.deleteProject(req.params.id);
      res.status(205).end();
    });
    
    app.use('/api/projects', projectRouter);
    
    app.listen(port, () => console.log(`aam visualizer server listening on port ${port}`));
  }
  initWatcher() {
    const args = [`${Consts.ENGINE_DIR}/watcher.rkt`];
    const options = { cwd: Consts.ENGINE_DIR };
    this.watcher = child_process.spawn('racket', args, options);
    
    // pipe console output
    this.watcher.stdout.setEncoding('utf8');
    this.watcher.stdout.on('data', (data) => {
      console.log(data.trim());
    });
    this.watcher.stderr.setEncoding('utf8');
    this.watcher.stderr.on('data', (data) => {
      let output = data.trim();
      G.log(Consts.LOG_TYPE_WATCHER, `ERROR: ${output}`);
    });
    this.watcher.on('close', (code) => {
      G.log(Consts.LOG_TYPE_WATCHER, `crashed (${code}) - restarting`);
      this.initWatcher();
    });
    G.log(Consts.LOG_TYPE_INIT, `starting watcher`);
  }

  createProject() {
    const projectId = `${Date.now()}`;
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - creating`);
    this.projects[projectId] = new Project();
    return projectId;
  }
  addProject(projectId) {
    let project = new Project();
    this.projects[projectId] = project;
    return project;
  }
  saveProject(projectId, data) {
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - saving`);
    const project  = this.projects[projectId];
    const name = data.name;
    const code = data.code;
    switch (project.status) {
      case project.STATUSES.empty:
      case project.STATUSES.edit:
        if (code !== undefined)
          project.importCode(code);
      default:
        if (name !== undefined)
          project.setName(name);
        this.writeProject(projectId);
        break;
    }
  }
  deleteProject(projectId) {
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - deleting`);
    delete this.projects[projectId];
    fs.remove(`${Consts.SAVE_DIR}/${projectId}`);
    fs.remove(`${Consts.INPUT_DIR}/${projectId}`);
    fs.remove(`${Consts.OUTPUT_DIR}/${projectId}`);
  }
  processProject(projectId) {
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - submitting`);
    const project = this.projects[projectId];
    switch (project.status) {
      case project.STATUSES.empty:
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - cannot process empty project`);
        break;
      case project.STATUSES.edit:
        project.setStatus(project.STATUSES.process);
        this.writeProject(projectId, Consts.INPUT_DIR);
        fs.remove(`${Consts.SAVE_DIR}/${projectId}`);
        this.checkProject(projectId);
        break;
      default:
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - immutable`);
        break;
    }
  }
  checkProject(projectId) {
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - checking processing status`);
    this.readProject(Consts.OUTPUT_DIR, projectId, projectId => {
      const project = this.projects[projectId];
      switch (project.status) {
        case project.STATUSES.process:
          G.log(Consts.LOG_TYPE_PROJ, `${projectId} - processing`)
          setTimeout(() => this.checkProject(projectId), 1000);
          break;
        case project.STATUSES.done:
          G.log(Consts.LOG_TYPE_PROJ, `${projectId} - done`);
          break;
        default:
          G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - invalid status to check`);
          break;
      }
    });
  }
  getProjectList() {
    const list = {};
    for (const [id, project] of Object.entries(this.projects)) {
      const project = this.projects[id];
      list[id] = {
        status: project.status,
        name: project.name
      }
    }
    return list;
  }
  
  // file system handlers
  initData() {
    if (Consts.INIT_DATA) {
      G.log(Consts.LOG_TYPE_INIT, 'clearing data');
      fs.removeSync(Consts.DATA_DIR);
    }
    G.log(Consts.LOG_TYPE_INIT, 'initializing data');
    fs.ensureDirSync(Consts.OUTPUT_DIR);
    fs.ensureDirSync(Consts.INPUT_DIR);
    fs.ensureDirSync(Consts.SAVE_DIR);
    this.readProjectDir(Consts.OUTPUT_DIR);
    this.readProjectDir(Consts.INPUT_DIR, projectId => {
      this.checkProject(projectId);
    });
    this.readProjectDir(Consts.SAVE_DIR);
  }
  writeProject(projectId, dirPath)
  {
    const project = this.projects[projectId];
    // if no new dirPath, get set dirPath
    if (dirPath == undefined)
      dirPath = project.getDirPath();
    else
      project.setDirPath(dirPath);
    
    const filePath = `${dirPath}/${projectId}`;
    const output = {};
    switch (project.status) {
      case project.STATUSES.done:
        output.graphs = project.graphs;
      default:
        output.id = projectId;
        output.name = project.name;
        output.code = project.code;
        output.status = project.status;
        output.analysis = project.analysis;
        break;
    }
    
    fs.writeFile(filePath, JSON.stringify(output), 'utf8', err => {
      if (err)
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - write failed`);
    });
  }
  readProjectDir(dirPath, callback = projectId => {}) {
    const fileList = fs.readdirSync(dirPath);
    fileList.forEach(projectId => {
      const project = this.projects[projectId];
      if (project)
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - already imported`);
      else {
        this.projects[projectId] = new Project();
        this.readProject(dirPath, projectId, callback);
      }
    });
  }
  readProject(dirPath, projectId, callback = projectId => {}) {
    const project = this.projects[projectId];
    fs.readFile(`${dirPath}/${projectId}`, { encoding: 'utf-8' }, (error, dataString) => {
      if (error) {
        if (error.code == 'ENOENT') {
          G.log(Consts.LOG_TYPE_PROJ, `${projectId} - not found`);
          callback(projectId);
        } else
          G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - read failed`);
      } else {
        const data = JSON.parse(dataString);
        if (data.id == projectId) {
          project.setDirPath(dirPath);
          project.setName(data.name);
          project.setStatus(project.STATUSES.edit);
          project.importCode(data.code);
          if (data.graphs && Object.entries(data.graphs).length > 0) {
            project.setStatus(project.STATUSES.process);
            project.importGraphs(data.graphs);
          }
          project.setStatus(data.status);
          callback(projectId);
        } else
          G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - data id (${data.id}) mismatch`);
      }
    });
  }
}

module.exports = Server;
