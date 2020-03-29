const child_process = require('child_process');
const chalk = require('chalk');
const express = require('express');

const {
  HOSTNAME, PORT,
  ENGINE_DISABLED,
  WATCHER_ACTION_PROCESS, WATCHER_ACTION_CANCEL, WATCHER_PATH,
  BUILD_DIR,
  LOG_TYPE_HTTP, INIT_LOG_TYPE, LOG_TYPE_PROJ, LOG_TYPE_WATCHER, ENGINE_LOG_TYPE, LOG_TYPE_SYS
} = require('../Consts');
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
    app.use(express.static(BUILD_DIR));
    
    // logging
    app.all('*', (req, res, next) => {
      const path = req.path;
      const method = chalk.yellowBright(req.method);
      consoleLog(LOG_TYPE_HTTP, `${path} ${method}`);
      res.on('finish', function() {
        const status = chalk.bold(res.statusCode);
        consoleLog(LOG_TYPE_HTTP, `${path} ${method} (${status})`)
      });
      next();
    });

    // api request routing
    app.use('/api/:userId', UserRouter(this));

    app.listen(PORT, function() {
      const address = chalk.blueBright(`${HOSTNAME}:${PORT}`);
      consoleLog(INIT_LOG_TYPE, `server listening at ${address}`)
    });
  }

  /** initialize watcher process */
  initWatcher() {
    // reject if engine disabled
    if (ENGINE_DISABLED) {
      const engineStatus = chalk.yellowBright('undefined engine');
      const analysisAPIStatus = chalk.bold('analysis api disabled');
      consoleLog(INIT_LOG_TYPE, `${engineStatus}, ${analysisAPIStatus}`);
      return;
    }

    const options = { stdio: [0, 1, 2, 'ipc'] };
    const watcher = child_process.fork(WATCHER_PATH, [], options);
    watcher.on('message', async data => {
      const action = data.action;
      switch (action) {
        case WATCHER_ACTION_PROCESS: {
          this.db.setStage(data.id, this.db.STAGES.done);
          const projectData = await this.db.getProject(data.id);
          const project = this.projects[data.id];
          project.import(projectData);
          break;
        }
        case WATCHER_ACTION_CANCEL: {
          this.db.setStage(data.id, this.db.STAGES.edit);
          const projectData = await this.db.getProject(data.id);
          const project = this.projects[data.id];
          project.import(projectData);
          break;
        }
      }
    });
    watcher.on('close', code => {
      consoleError(LOG_TYPE_WATCHER, `crashed (${code}) - restarting`);
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
      action: WATCHER_ACTION_PROCESS
    });
  }

  /**
   * send watcher cancel message
   * @param {String} fileId 
   */
  cancelWatcher(fileId) {
    this.watcher.send({
      id: fileId,
      action: WATCHER_ACTION_CANCEL
    });
  }

  /**
   * @param {String} userId project owner user id
   * @returns {String} project id
   */
  async createProject(userId) {
    const projectId = `${Date.now()}`;

    const status = chalk.bold('creating');
    consoleLog(LOG_TYPE_PROJ, `${projectId} ${status}`);

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
    const status = chalk.bold('saving');
    consoleLog(LOG_TYPE_SYS, `project ${projectId} ${status}`);

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
    const status = chalk.bold('deleting');
    consoleLog(LOG_TYPE_PROJ, `${projectId} ${status}`);

    await this.db.deleteProject(projectId);
    delete this.projects[projectId];
  }

  /**
   * @param {String} projectId project id
   */
  async processProject(projectId) {
    // reject if engine disabled
    if (ENGINE_DISABLED) {
      const errorStatus = chalk.redBright('process rejected');
      consoleError(ENGINE_LOG_TYPE, `project ${projectId} ${errorStatus} - disabled engine`);
      return;
    }

    const status = chalk.bold('processing');
    consoleLog(LOG_TYPE_PROJ, `${projectId} ${status}`);
    
    const project = this.projects[projectId];
    switch (project.status) {
      case project.STATUSES.empty:
        consoleError(LOG_TYPE_PROJ, `${projectId} empty`);
        break;
      case project.STATUSES.edit:
        project.status = project.STATUSES.process;
        await this.db.setProject(projectId, project.export());
        await this.db.setProjectStage(projectId, this.db.STAGES.process);
        this.notifyWatcher(projectId);
        break;
      default:
        consoleError(LOG_TYPE_PROJ, `${projectId} immutable`);
        break;
    }
  }

  /**
   * @param {String} projectId project id
   */
  async cancelProject(projectId) {
    // reject if engine disabled
    if (ENGINE_DISABLED) {
      const errorStatus = chalk.redBright('cancel rejected');
      consoleError(ENGINE_LOG_TYPE, `project ${projectId} ${errorStatus} - disabled engine`);
      return;
    }

    const status = chalk.bold('canceling');
    consoleLog(LOG_TYPE_PROJ, `${projectId} ${status}`);

    const project = this.projects[projectId];
    switch (project.status) {
      case project.STATUSES.process:
        this.cancelWatcher(projectId);
        break;
      default:
        consoleError(LOG_TYPE_PROJ, `${projectId} ${project.status} status`)
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
