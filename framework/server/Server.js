const child_process = require('child_process');
const express = require('express');
const fse = require('fs-extra');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const Consts = require('./Consts.js');
const G = require('./Global.js');
const Project = require('./Project.js');
const Database = require('./Database.js');

class Server {
  constructor() {
    this.projects = {};
    this.db = new Database();
    this.init();
  }
  async init() {
    await this.db.init();
    await this.initData();
    this.initServer();
    this.initWatcher();
  }

  /** initialize server process */
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

  /** initialize watcher process */
  initWatcher() {
    G.log(Consts.LOG_TYPE_INIT, `starting watcher`);
    const options = { stdio: [0, 1, 2, 'ipc'] };
    const watcher = child_process.fork(path.resolve(__dirname, 'watcher.js'), [], options);
    watcher.on('message', async data => {
      const action = data.action;
      switch (action) {
        case Consts.WATCHER_ACTION_PROCESS: {
          this.db.setStage(data.id, this.db.STAGES.done);
          const projectData = await this.db.getProject(data.id);
          const project = this.projects[data.id];
          project.import(projectData);
          break;
        }
        case Consts.WATCHER_ACTION_CANCEL: {
          this.db.setStage(data.id, this.db.STAGES.edit);
          const projectData = await this.db.getProject(data.id);
          const project = this.projects[data.id];
          project.import(projectData);
          break;
        }
      }
    });
    watcher.on('close', code => {
      G.log(Consts.LOG_TYPE_WATCHER, `crashed (${code}) - restarting`);
      this.initWatcher();
    });
    
    this.watcher = watcher;
  }

  /** send watcher process message */
  notifyWatcher(file) {
    this.watcher.send({
      id: file,
      action: Consts.WATCHER_ACTION_PROCESS
    });
  }

  /** send watcher cancel message */
  cancelWatcher(file) {
    this.watcher.send({
      id: file,
      action: Consts.WATCHER_ACTION_CANCEL
    });
  }

  /**
   * @param {String} userId project owner user id
   * @returns {String} project id
   */
  async createProject(userId) {
    const projectId = `${Date.now()}`;
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - create`);
    const project = new Project(userId);
    this.projects[projectId] = project;
    await this.db.setProject(projectId, project.export());
    return projectId;
  }

  /**
   * @param {String} projectId project id
   * @param {Object} data project data
   */
  async saveProject(projectId, data) {
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - save`);
    const project  = this.projects[projectId];
    const { name, analysisInput } = data;
    switch (project.status) {
      case project.STATUSES.empty:
      case project.STATUSES.edit:
        project.setAnalysisInput(analysisInput);
      default:
        if (name !== undefined)
          project.name = name;
        await this.db.setProject(projectId, project.export());
        break;
    }
  }

  /**
   * @param {String} projectId project id
   */
  async deleteProject(projectId) {
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - delete`);
    await this.db.deleteProject(projectId);
    delete this.projects[projectId];
  }

  /**
   * @param {String} projectId project id
   */
  async processProject(projectId) {
    G.log(Consts.LOG_TYPE_PROJ, `${projectId} - process`);
    const project = this.projects[projectId];
    switch (project.status) {
      case project.STATUSES.empty:
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - cannot process empty project`);
        break;
      case project.STATUSES.edit:
        project.status = project.STATUSES.process;
        await this.db.setProject(projectId, project.export());
        await this.db.setProjectStage(projectId, this.db.STAGES.process);
        this.notifyWatcher(projectId);
        break;
      default:
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projectId} - immutable`);
        break;
    }
  }

  /**
   * @param {String} projectId project id
   */
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

  /**
   * @param {String} userId project owner user id
   * @returns {Object} <{String} projectId, {Object} projectData> hashmap
   */
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
  
  /** initialize data directories */
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

    for (const projectId of this.db.getProjectIds()) {
      const data = await this.db.getProject(projectId);
      const project = new Project();
      this.projects[projectId] = project;
      project.import(data);
    }
  }
}

module.exports = Server;
