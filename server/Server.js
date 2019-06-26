const child_process = require('child_process');
const express = require('express');
const fse = require('fs-extra');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const Consts = require('./Consts.js');
const G = require('./Global.js');
const Project = require('./Project.js');

class Server {
  constructor() {
    this.projects = {};
    this.init();
  }
  async init() {
    await this.initData();
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
    projectRouter.put('/save', async (req, res) => {
      const projectId = req.params.id;
      const data = req.body;
      await this.saveProject(projectId, data);
      res.status(202).end();
    });
    projectRouter.put('/process', async (req, res) => {
      const projectId = req.params.id;
      const project = this.projects[projectId];
      switch (project.status) {
        case project.STATUSES.edit:
          const options = req.body;
          project.analysis = options.analysis;
          await this.processProject(projectId);
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
  async saveProject(projectId, data) {
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
        await this.writeProject(projectId);
        break;
    }
  }
  deleteProject(projectId) {
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - delete`);
    const project = this.projects[projectId];
    fse.remove(`${project.dirPath}/${projectId}`);
    delete this.projects[projectId];
  }
  async processProject(projectId) {
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - process`);
    const project = this.projects[projectId];
    switch (project.status) {
      case project.STATUSES.empty:
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - cannot process empty project`);
        break;
      case project.STATUSES.edit:
        project.status = project.STATUSES.process;
        await this.writeProject(projectId, Consts.INPUT_DIR);
        this.notifyWatcher(projectId);
        fse.remove(`${Consts.SAVE_DIR}/${projectId}`);
        //this.checkProject(projectId);
        break;
      default:
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - immutable`);
        break;
    }
  }
  async checkProject(projectId) {
    await this.readProject(Consts.OUTPUT_DIR, projectId);
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
    };
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
  async initData() {
    if (Consts.INIT_DATA) {
      G.log(Consts.LOG_TYPE_INIT, 'clear data');
      fse.removeSync(Consts.DATA_DIR);
    }

    // ensure data directories
    G.log(Consts.LOG_TYPE_INIT, 'ensure directories');
    fse.ensureDirSync(Consts.OUTPUT_DIR);
    fse.ensureDirSync(Consts.INPUT_DIR);
    fse.ensureDirSync(Consts.SAVE_DIR);

    // read data directories
    G.log(Consts.LOG_TYPE_INIT, 'read data');
    await this.readProjectDir(Consts.OUTPUT_DIR);
    await this.readProjectDir(Consts.INPUT_DIR);
    await this.readProjectDir(Consts.SAVE_DIR);
  }
  async writeProject(projectId, dirPath) {
    const project = this.projects[projectId];
    // if no new dirPath, get set dirPath
    if (dirPath == undefined)
      dirPath = project.dirPath;
    else
      project.dirPath = dirPath;
    
    const filePath = `${dirPath}/${projectId}`;
    const output = project.export(projectId);
    const file = await fsp.open(filePath, 'w');
    await file.writeFile(JSON.stringify(output));
    await file.close();
  }
  async readProjectDir(dirPath) {
    const fileList = fse.readdirSync(dirPath);
    fileList.forEach(async projectId => {
      const project = this.projects[projectId];
      if (project)
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - import duplicate`);
      else {
        this.projects[projectId] = new Project();
        await this.readProject(dirPath, projectId)
      }
    });
  }
  async readProject(dirPath, projectId) {
    let file;
    try {
      const filePath = path.join(dirPath, projectId);
      file = await fsp.open(filePath, 'r');
      const data = await file.readFile({encoding: 'utf-8'});
      const json = JSON.parse(data);
      const project = this.projects[projectId];
      project.dirPath = dirPath;
      project.import(json);
    } catch(err) {
      switch (err.code) {
        case 'ENOENT':
          G.log(Consts.LOG_TYPE_PROJ, `${projectId} - not found`);
          break;
        default:
          G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - read fail (${err.code})`);
          break;
      }
    } finally {
      await file.close();
    }
  }
}

module.exports = Server;
