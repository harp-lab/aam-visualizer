const Consts = require('../Consts.js');
const { consoleError } = require('../Global.js');

// variables allowed for data import/export access
const allowedDataKeys = [
  'userId',
  'status',
  'error',
  'name',
  'analysis',
  'analysisInput',
  'analysisOutput'
];

class Project {
  /**
   * @param {String} userId project owner user id
   */
  constructor(userId) {
    this.userId = userId;
    this.dirPath = Consts.SAVE_DIR;
    
    this.STATUSES = {
      empty: 'empty',
      edit: 'edit',
      process: 'process',
      done: 'done',
      error: 'error'
    };
    this.status = this.STATUSES.empty;
  }

  /**
   * @param {Object} data project data
   */
  import(data) {
    for (const key of allowedDataKeys) {
      this[key] = data[key];
    }
  }

  /**
   * @param {} analysisInput project analysis input
   */
  setAnalysisInput(analysisInput) {
    switch (this.status) {
      case this.STATUSES.empty:
      case this.STATUSES.edit:
      case this.STATUSES.process:
        this.analysisInput = analysisInput;
        if (!analysisInput)
          this.status = this.STATUSES.empty;
        else
          this.status = this.STATUSES.edit;
        break;
      default:
        consoleError(Consts.LOG_TYPE_SYS, 'project analysis input import rejected - immutable');
        break;
    }
  }

  /**
   * @param {Object} analysisOutput project analysis output
   */
  setAnalysisOutput(analysisOutput) {
    switch (this.status) {
      case this.STATUSES.process:
        this.analysisOutput = analysisOutput;
        this.status = this.STATUSES.done;
        break;
      default:
        consoleError(Consts.LOG_TYPE_SYS, 'project analysis output import rejected - immutable');
        break;
    }
  }

  /**
   * export project object data format
   * @returns {Object} project data
   */
  export() {
    const data = {};
    for (const key of allowedDataKeys) {
      data[key] = this[key];
    }

    return data;
  }
}

module.exports = Project;
