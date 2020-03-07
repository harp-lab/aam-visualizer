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
    app.use(express.static(Consts.BUILD_DIR));
    
    // logging
    app.all('*', (req, res, next) => {
      const path = req.path;
      const method = req.method;
      G.log(Consts.LOG_TYPE_HTTP, `${path} ${method}`);
      res.on('finish', () => G.log(Consts.LOG_TYPE_HTTP, `${path} ${method} ${res.statusCode}`));
      next();
    });

    // handle project requests
    const projectRouter = express.Router({ mergeParams: true });
    projectRouter.all('*', (req, res, next) => {
      const projectId = req.params.projectId;
      if (this.projects[projectId])
        next();
      else
        res.status(404).end();
    });
    projectRouter.get('/code', (req, res) => {
      const projectId = req.params.projectId;
      const project = this.projects[projectId];
      res.json({ id: projectId, analysisInput: project.analysisInput })
        .status(200).end();
    });
    projectRouter.get('/data', (req, res) => {
      const projectId = req.params.projectId;
      const project = this.projects[projectId];
      switch (project.status) {
        case project.STATUSES.done:
        case project.STATUSES.error:
          res.json(project.export(projectId))
            .status(200).end();
          break;
        case project.STATUSES.process:
          res.status(204).end();
          break;
        default:
          res.status(412).end();
          break;
      }
    });
    projectRouter.post('/save', async (req, res) => {
      const projectId = req.params.projectId;
      const data = req.body;
      await this.saveProject(projectId, data);
      res.status(202).end();
    });
    projectRouter.post('/clear', async (req, res) => {
      const { projectId } = req.params;
      const data = req.body;
      const project = this.projects[projectId];

      for (const key of Object.keys(data)) {
        data[key] = undefined;
      }

      switch (project.status) {
        case project.STATUSES.empty:
        case project.STATUSES.edit:
          this.saveProject(projectId, data);
          res.status(200).end();
          break;
        default:
          res.status(412).end();
          break;
      }
    });
    projectRouter.post('/process', async (req, res) => {
      const projectId = req.params.projectId;
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
    projectRouter.post('/cancel', async (req, res) => {
      const projectId = req.params.projectId;
      const project = this.projects[projectId];
      switch (project.status) {
        case project.STATUSES.process:
          await this.cancelProject(projectId);
          res.status(200).end();
          break;
        case project.STATUSES.done:
          res.status(409).end();
          break;
        default:
          res.status(412).end();
          break;
      }
    });
    projectRouter.post('/delete', async (req, res) => {
      const projectId = req.params.projectId;
      const project = this.projects[projectId];
      switch (project.status) {
        case project.STATUSES.process:
          res.status(412).end();
          break;
        default:
          await this.deleteProject(projectId);
          res.status(205).end();
          break;
      }
    });
    
    // handle user requests
    const userRouter = express.Router({ mergeParams: true });
    userRouter.get('/all', (req, res) => {
      res.json(this.getProjectList(req.params.userId))
        .status(200).end();
    });
    userRouter.post('/create', async (req, res) => {
      const projectId = await this.createProject(req.params.userId);
      res.json({ id: projectId })
        .status(200).end();
    });
    userRouter.use('/projects/:projectId', projectRouter);
    
    
    app.use('/api/:userId', userRouter);
    app.listen(Consts.PORT, () => G.log(Consts.LOG_TYPE_INIT, `http server listening on port ${Consts.PORT}`));
  }
  initWatcher() {
    G.log(Consts.LOG_TYPE_INIT, `starting watcher`);
    const options = { stdio: [0, 1, 2, 'ipc'] };
    const watcher = child_process.fork(path.resolve(__dirname, 'watcher.js'), [], options);
    watcher.on('message', data => {
      const action = data.action;
      switch (action) {
        case Consts.WATCHER_ACTION_PROCESS:
          this.readProject(Consts.OUTPUT_DIR, data.id);
          break;
        case Consts.WATCHER_ACTION_CANCEL:
          this.readProject(Consts.SAVE_DIR, data.id);
          break;
      }
    });
    watcher.on('close', code => {
      G.log(Consts.LOG_TYPE_WATCHER, `crashed (${code}) - restarting`);
      this.initWatcher();
    });
    
    this.watcher = watcher;
  }
  notifyWatcher(file) {
    this.watcher.send({
      id: file,
      action: Consts.WATCHER_ACTION_PROCESS
    });
  }
  cancelWatcher(file) {
    this.watcher.send({
      id: file,
      action: Consts.WATCHER_ACTION_CANCEL
    });
  }

  async createProject(userId) {
    const projectId = `${Date.now()}`;
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - create`);
    this.projects[projectId] = new Project(userId);
    await this.writeProject(projectId);
    return projectId;
  }
  async saveProject(projectId, data) {
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - save`);
    const project  = this.projects[projectId];
    const { name, analysisInput } = data;
    switch (project.status) {
      case project.STATUSES.empty:
      case project.STATUSES.edit:
        project.importAnalysisInput(analysisInput);
      default:
        if (name !== undefined)
          project.name = name;
        await this.writeProject(projectId);
        break;
    }
  }
  async deleteProject(projectId) {
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - delete`);
    const project = this.projects[projectId];
    await fsp.unlink(`${project.dirPath}/${projectId}`);
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
        await fsp.unlink(`${Consts.SAVE_DIR}/${projectId}`);
        break;
      default:
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - immutable`);
        break;
    }
  }
  async cancelProject(projectId) {
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - cancel`);
    const project = this.projects[projectId];
    switch (project.status) {
      case project.STATUSES.process:
        this.cancelWatcher(projectId);
        break;
      default:
        G.log(Cosnts.LOG_TYPE_SYS, `ERROR: project ${projectId} - cannot cancel project not processing`)
        break;
    }
  }
  getProjectList(userId) {
    const list = {};
    for (const [id, project] of Object.entries(this.projects)) {
      if (project.userId == userId)
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
      await fse.remove(Consts.DATA_DIR);
    }

    // ensure data directories
    G.log(Consts.LOG_TYPE_INIT, 'ensure directories');
    const options = { recursive: true };
    await fsp.mkdir(Consts.OUTPUT_DIR, options);
    await fsp.mkdir(Consts.INPUT_DIR, options);
    await fsp.mkdir(Consts.SAVE_DIR, options);

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
    const fileList = await fsp.readdir(dirPath);
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
      file = await fsp.open(filePath);
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
