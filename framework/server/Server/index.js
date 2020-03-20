const child_process = require('child_process');
const express = require('express');

const Consts = require('../Consts');
const { consoleLog, consoleError } = require('../Global');

const Project = require('./Project');
const Database = require('./Database');
const UserRouter = require('./routers/UserRouter');

class Server {
  constructor() {
    this.projects = {};
    this.init();
  }
  async init() {
    this.db = new Database();
    await this.db.init();

    await this.initData();
    this.initWebServer();
    this.initWatcher();
  }

  /** initialize data directories */
  async initData() {
    for (const projectId of this.db.getProjectIds()) {
      const data = await this.db.getProject(projectId);
      const project = new Project();
      this.projects[projectId] = project;
      project.import(data);
    }
  }

  /** initialize server process */
  initWebServer() {
    const app = express();
    app.use(express.json());
    app.use(express.static(Consts.BUILD_DIR));
    
    // logging
    app.all('*', (req, res, next) => {
      const path = req.path;
      const method = req.method;
      consoleLog(Consts.LOG_TYPE_HTTP, `${path} ${method}`);
      res.on('finish', () => consoleLog(Consts.LOG_TYPE_HTTP, `${path} ${method} ${res.statusCode}`));
      next();
    });

    // api request routing
    app.use('/api/:userId', UserRouter(this));

    app.listen(Consts.PORT, () => consoleLog(Consts.LOG_TYPE_INIT, `http server listening on port ${Consts.PORT}`));
  }

  /** initialize watcher process */
  initWatcher() {
    consoleLog(Consts.LOG_TYPE_INIT, `starting watcher`);
    const options = { stdio: [0, 1, 2, 'ipc'] };
    const watcher = child_process.fork(Consts.WATCHER_PATH, [], options);
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
      consoleLog(Consts.LOG_TYPE_WATCHER, `crashed (${code}) - restarting`);
      this.initWatcher();
    });
    
    this.watcher = watcher;
  }

  /**
   * send watcher process message
   * @param {String} fileId 
   */
  notifyWatcher(fileId) {
    this.watcher.send({
      id: fileId,
      action: Consts.WATCHER_ACTION_PROCESS
    });
  }

  /**
   * send watcher cancel message
   * @param {String} fileId 
   */
  cancelWatcher(fileId) {
    this.watcher.send({
      id: fileId,
      action: Consts.WATCHER_ACTION_CANCEL
    });
  }

  /**
   * @param {String} userId project owner user id
   * @returns {String} project id
   */
  async createProject(userId) {
    const projectId = `${Date.now()}`;
    consoleLog(Consts.LOG_TYPE_PROJ, `${projectId} - create`);
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
    consoleLog(Consts.LOG_TYPE_PROJ, `${projectId} - save`);
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
    consoleLog(Consts.LOG_TYPE_PROJ, `${projectId} - delete`);
    await this.db.deleteProject(projectId);
    delete this.projects[projectId];
  }

  /**
   * @param {String} projectId project id
   */
  async processProject(projectId) {
    consoleLog(Consts.LOG_TYPE_PROJ, `${projectId} - process`);
    const project = this.projects[projectId];
    switch (project.status) {
      case project.STATUSES.empty:
        consoleError(Consts.LOG_TYPE_PROJ, `${projectId} - cannot process empty project`);
        break;
      case project.STATUSES.edit:
        project.status = project.STATUSES.process;
        await this.db.setProject(projectId, project.export());
        await this.db.setProjectStage(projectId, this.db.STAGES.process);
        this.notifyWatcher(projectId);
        break;
      default:
        consoleError(Consts.LOG_TYPE_PROJ, `${projectId} - immutable`);
        break;
    }
  }

  /**
   * @param {String} projectId project id
   */
  async cancelProject(projectId) {
    consoleLog(Consts.LOG_TYPE_PROJ, `${projectId} - cancel`);
    const project = this.projects[projectId];
    switch (project.status) {
      case project.STATUSES.process:
        this.cancelWatcher(projectId);
        break;
      default:
        consoleError(Cosnts.LOG_TYPE_PROJ, `${projectId} - cannot cancel project not processing`)
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
}

module.exports = Server;
