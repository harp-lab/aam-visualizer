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
    app.use(express.json());
    app.use(express.static(path.join(__dirname, '../build')));
    
    // logging
    app.all('*', (req, res, next) => {
      const path = req.path;
      const method = req.method;
      G.log(Consts.LOG_TYPE_HTTP, `${path} ${method}`);
      res.on('finish', () => G.log(Consts.LOG_TYPE_HTTP, `${path} ${method} ${res.statusCode}`));
      next();
    });

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
    
    // handle project requests
    const projectRouter = express.Router({ mergeParams: true });
    projectRouter.all('*', (req, res, next) => {
      const projectId = req.params.id;
      if (this.projects[projectId])
        next();
      else
        res.status(404).end();
    });
    projectRouter.get('/code', (req, res) => {
      const projectId = req.params.id;
      const project = this.projects[projectId];
      res.json({ id: projectId, code: project.code })
        .status(200)
        .end();
    });
    projectRouter.get('/data', (req, res) => {
      const projectId = req.params.id;
      const project = this.projects[projectId];
      switch (project.status) {
        case project.STATUSES.done:
        case project.STATUSES.error:
          res.json(project.export(projectId))
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
    projectRouter.put('/save', (req, res) => {
      const projectId = req.params.id;
      const data = req.body;
      this.saveProject(projectId, data);
      res.status(202).end();
    });
    projectRouter.put('/process', (req, res) => {
      const projectId = req.params.id;
      const project = this.projects[projectId];
      switch (project.status) {
        case project.STATUSES.edit:
          const options = req.body;
          project.analysis = options.analysis;
          this.processProject(projectId);
          res.status(200).end();
          break;
        default:
          res.status(412).end();
          break;
      }
    });
    projectRouter.put('/delete', (req, res) => {
      this.deleteProject(req.params.id);
      res.status(205).end();
    });
    
    app.use('/api/projects/:id', projectRouter);
    
    app.listen(Consts.PORT, () => G.log(Consts.LOG_TYPE_INIT, `http server listening on port ${Consts.PORT}`));
  }
  initWatcher() {
    G.log(Consts.LOG_TYPE_INIT, `starting watcher`);
    const options = {
      stdio: [0, 1, 2, 'ipc']
    };
    const watcher = child_process.fork(path.resolve(__dirname, 'watcher.js'), [], options);

    watcher.on('message', data => {
      const id = data.id;
      this.readProject(Consts.OUTPUT_DIR, id);
    });
    watcher.on('close', code => {
      G.log(Consts.LOG_TYPE_WATCHER, `crashed (${code}) - restarting`);
      this.initWatcher();
    });
    
    this.watcher = watcher;
  }
  notifyWatcher(file) {
    this.watcher.send({ id: file });
  }

  createProject() {
    const projectId = `${Date.now()}`;
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - creating`);
    this.projects[projectId] = new Project();
    return projectId;
  }
  saveProject(projectId, data) {
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - saving`);
    const project  = this.projects[projectId];
    const name = data.name;
    const code = data.code;
    switch (project.status) {
      case project.STATUSES.empty:
      case project.STATUSES.edit:
        if (code)
          project.importCode(code);
      default:
        if (name)
          project.name = name;
        this.writeProject(projectId);
        break;
    }
  }
  deleteProject(projectId) {
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - delete`);
    const project = this.projects[projectId];
    fs.remove(`${project.dirPath}/${projectId}`);
    delete this.projects[projectId];
  }
  processProject(projectId) {
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - process`);
    const project = this.projects[projectId];
    switch (project.status) {
      case project.STATUSES.empty:
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - cannot process empty project`);
        break;
      case project.STATUSES.edit:
        project.status = project.STATUSES.process;
        this.writeProject(projectId, Consts.INPUT_DIR);
        this.notifyWatcher(projectId);
        fs.remove(`${Consts.SAVE_DIR}/${projectId}`);
        //this.checkProject(projectId);
        break;
      default:
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - immutable`);
        break;
    }
  }
  checkProject(projectId) {
    this.readProject(Consts.OUTPUT_DIR, projectId, projectId => {
      const project = this.projects[projectId];
      switch (project.status) {
        case project.STATUSES.process:
          G.log(Consts.LOG_TYPE_PROJ, `${projectId} - status: process`)
          setTimeout(() => this.checkProject(projectId), 1000);
          break;
        case project.STATUSES.error:
        case project.STATUSES.done:
          G.log(Consts.LOG_TYPE_PROJ, `${projectId} - status: done`);
          break;
        default:
          G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - invalid status check`);
          break;
      }
    });
  }
  getProjectList() {
    const list = {};
    for (const [id, project] of Object.entries(this.projects)) {
      list[id] = {
        status: project.status,
        name: project.name,
        analysis: project.analysis
      }
    }
    return list;
  }
  
  // file system handlers
  initData() {
    if (Consts.INIT_DATA) {
      G.log(Consts.LOG_TYPE_INIT, 'clear data');
      fs.removeSync(Consts.DATA_DIR);
    }

    // ensure data directories
    G.log(Consts.LOG_TYPE_INIT, 'ensure directories');
    fs.ensureDirSync(Consts.OUTPUT_DIR);
    fs.ensureDirSync(Consts.INPUT_DIR);
    fs.ensureDirSync(Consts.SAVE_DIR);

    // read data directories
    G.log(Consts.LOG_TYPE_INIT, 'read data');
    this.readProjectDir(Consts.OUTPUT_DIR);
    this.readProjectDir(Consts.INPUT_DIR, projectId => this.checkProject(projectId));
    this.readProjectDir(Consts.SAVE_DIR);
  }
  writeProject(projectId, dirPath) {
    const project = this.projects[projectId];
    // if no new dirPath, get set dirPath
    if (dirPath == undefined)
      dirPath = project.dirPath;
    else
      project.dirPath = dirPath;
    
    const filePath = `${dirPath}/${projectId}`;
    const output = project.export(projectId);
    fs.writeFile(filePath, JSON.stringify(output), 'utf8', err => {
      if (err)
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - write fail`);
    });
  }
  readProjectDir(dirPath, callback = projectId => {}) {
    const fileList = fs.readdirSync(dirPath);
    fileList.forEach(projectId => {
      const project = this.projects[projectId];
      if (project)
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - import duplicate`);
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
          G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - read fail`);
      } else {
        const data = JSON.parse(dataString);
        if (data.id == projectId) {
          project.dirPath = dirPath;
          project.name = data.name;
          project.analysis = data.analysis;
          project.importCode(data.code);
          if (data.graphs) {
            project.status = project.STATUSES.process;
            project.importGraphs(data.graphs);
            project.ast = data.ast;
          }
          project.status = data.status;
          if (data.status == 'error')
            project.error = data.error;
          project.store = data.store;
          callback(projectId);
        } else
          G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - data id (${data.id}) mismatch`);
      }
    });
  }
}

module.exports = Server;
