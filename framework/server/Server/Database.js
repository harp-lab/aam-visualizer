const fse = require('fs-extra');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const { SERVER_DIR, INIT_DATA, DATA_LOG_TYPE } = require('../Consts');
const { consoleLog, consoleError } = require('../Global');

const DATA_DIR = path.resolve(SERVER_DIR, 'data');
const EDIT_DIR = path.resolve(DATA_DIR, 'save');
const PROCESS_DIR = path.resolve(DATA_DIR, 'input');
const DONE_DIR = path.resolve(DATA_DIR, 'output');

class Database {
  constructor() {
    this.STAGES = {
      edit: 'edit',
      process: 'process',
      done: 'done'
    };
    this.projects = {};
  }

  /** initialize instance */
  async init() {
    if (INIT_DATA) {
      consoleLog(DATA_LOG_TYPE, 'clear data');
      await fse.remove(DATA_DIR);
    }

    // ensure data directories
    consoleLog(DATA_LOG_TYPE, 'ensure directories');
    const options = { recursive: true };
    await fsp.mkdir(DONE_DIR, options);
    await fsp.mkdir(PROCESS_DIR, options);
    await fsp.mkdir(EDIT_DIR, options);

    for (const stage of Object.values(this.STAGES)) {
      await this.initStage(stage);
    }
  }

  /**
   * read projects in stage directory and store project stage
   * @param {String} stage project stage
   */
  async initStage(stage) {
    const path = this.stagePath(stage);
    const fileList = await fsp.readdir(path);
    for (const projectId of fileList) {
      this.projects[projectId] = stage;
    }
  }

  /**
   * @param {String} path file path
   * @param {Object} data file data
   */
  async write(path, data) {
    const file = await fsp.open(path, 'w');
    await file.writeFile(JSON.stringify(data));
    await file.close();
  }

  /**
   * @param {String} oldPath old file path
   * @param {String} newPath new file path
   */
  async move(oldPath, newPath) {
    await fsp.rename(oldPath, newPath);
  }

  /**
   * @param {String} path file path
   * @returns {Object} file data
   */
  async read(path) {
    let file, json;
    try {
      file = await fsp.open(path);
      const data = await file.readFile({encoding: 'utf-8'});
      json = JSON.parse(data);
    } catch(err) {
      switch (err.code) {
        case 'ENOENT':
          consoleError(DATA_LOG_TYPE, `project ${projectId} not found`);
          break;
        default:
          consoleError(DATA_LOG_TYPE, `project ${projectId} read fail (${err.code})`);
          break;
      }
    } finally {
      await file.close();
      return json;
    }
  }

  getProjectIds() {
    return Object.keys(this.projects);
  }

  /**
   * @param {String} stage projct stage
   * @returns {Object} <{String} projectId, {String} stage> hashmap
   */
  getStageProjectIds(stage) {
    const projectIds = {};
    for (const [projectId, projectStage] of Object.entries(this.projects)) {
      if (projectStage === stage)
        projectIds[projectId] = stage;
    }
    return projectIds;
  }

  /**
   * @param {String} projectId project id
   * @returns {Object} project data
   */
  async getProject(projectId) {
    const stage = this.getStage(projectId);
    const path = this.path(projectId, stage);
    return await this.read(path);
  }

  /**
   * @param {String} projectId project id
   * @param {Object} data project data
   * @param {String} stage project stage
   */
  async setProject(projectId, data, stage = this.STAGES.edit) {
    const path = this.path(projectId, stage);
    await this.write(path, data);
    this.projects[projectId] = stage;
  }

  /**
   * 
   * @param {String} projectId project id
   */
  async deleteProject(projectId) {
    const stage = this.getStage(projectId);
    const path = this.path(projectId, stage);
    await fsp.unlink(path);
    delete this.projects[projectId];
  }

  /**
   * @param {String} projectId project id
   * @returns {String} project stage
   */
  getStage(projectId) {
    return this.projects[projectId];
  }

  /**
   * @param {String} projectId project id
   * @param {String} stage project stage
   */
  setStage(projectId, stage) {
    this.projects[projectId] = stage;
  }

  /**
   * @param {String} projectId project id
   * @param {String} newStage new project stage
   */
  async setProjectStage(projectId, newStage) {
    const oldStage = this.projects[projectId];
    const oldPath = this.path(projectId, oldStage);
    this.setStage(projectId, newStage);
    const newPath = this.path(projectId, newStage);
    await this.move(oldPath, newPath);
  }

  /**
   * get file path
   * @param {String} projectId project id
   * @param {String} stage project stage
   */
  path(projectId, stage) {
    const dirPath = this.stagePath(stage);
    return path.resolve(dirPath, projectId);
  }

  /**
   * @param {String} stage project stage
   * @returns {String} stage directory path
   */
  stagePath(stage) {
    let path;
    switch (stage) {
      case this.STAGES.edit:
        path = EDIT_DIR;
        break;
      case this.STAGES.process:
        path = PROCESS_DIR;
        break;
      case this.STAGES.done:
        path = DONE_DIR;
        break;
      default:
        // throw invalid stage
        break;
    }
    return path;
  }
}

module.exports = Database;
