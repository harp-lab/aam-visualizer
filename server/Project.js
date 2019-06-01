const Consts = require('./Consts.js');
const G = require('./Global.js');

class Project {
  constructor() {
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
  importGraphs(graphs) {
    switch (this.status) {
      case this.STATUSES.process:
        this.graphs = graphs;
        this.status = this.STATUSES.done;
        break;
      default:
        G.log(Consts.LOG_TYPE_SYS, 'ERROR: project graphs import rejected - immutable');
        break;
    }
  }
  export(projectId) {
    return {
      id: projectId,
      status: this.status,
      code: this.code,
      graphs: this.graphs,
      store: this.store,
      name: this.name,
      analysis: this.analysis
    }
  }
}

module.exports = Project;
