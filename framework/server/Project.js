const Consts = require('./Consts.js');
const G = require('./Global.js');

class Project {
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
  import(data) {
    this.userId = data.userId;
    this.name = data.name;
    this.analysis = data.analysis;
    this.importCode(data.code);
    if (data.analysisOutput) {
      this.status = this.STATUSES.process;
      this.importAnalysisOutput(data.analysisOutput);
      this.ast = data.ast;
    }
    this.status = data.status;
    if (data.status == 'error')
      this.error = data.error;
    this.store = data.store;
    this.analysisOutput = data.analysisOutput;
  }
  importCode(code) {
    switch (this.status) {
      case this.STATUSES.empty:
      case this.STATUSES.edit:
      case this.STATUSES.process:
        this.code = code;
        if (code == "")
          this.status = this.STATUSES.empty;
        else
          this.status = this.STATUSES.edit;
        break;
      default:
        G.log(Consts.LOG_TYPE_SYS, 'ERROR: project code import rejected - immutable');
        break;
    }
  }
  importAnalysisOutput(analysisOutput) {
    switch (this.status) {
      case this.STATUSES.process:
        this.analysisOutput = analysisOutput;
        this.status = this.STATUSES.done;
        break;
      default:
        G.log(Consts.LOG_TYPE_SYS, 'ERROR: project analysis output import rejected - immutable');
        break;
    }
  }
  export() {
    return {
      userId: this.userId,
      status: this.status,
      error: this.error,
      code: this.code,
      graphs: this.graphs,
      ast: this.ast,
      store: this.store,
      name: this.name,
      analysis: this.analysis,
      analysisOutput: this.analysisOutput
    }
  }
}

module.exports = Project;
