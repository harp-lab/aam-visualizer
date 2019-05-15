const Consts = require('./Consts.js');
const G = require('./Global.js');

class Project
{
  constructor()
  {
    this.name = '';
    this.dirPath = Consts.SAVE_DIR;
    this.ast = [];
    this.astStart = null;
    this.graphs = {};
    this.code = '';
    
    this.STATUSES =
    {
      empty: 'empty',
      edit: 'edit',
      process: 'process',
      done: 'done',
      error: 'error'
    };
    this.status = this.STATUSES.empty;
  }
  importGraphs(graphs) {
    switch (this.status)
    {
      case this.STATUSES.process:
        for (let [graphType, graph] of Object.entries(graphs))
          this.graphs[graphType] = graph;
        break;
      default:
        G.log(Consts.LOG_TYPE_SYS, 'ERROR: project ast import rejected - not processing');
        break;
    }
  }
  importAst(ast)
  {
    switch (this.status)
    {
      case this.STATUSES.process:
        this.ast = ast;
        this.status = this.STATUSES.done;
        break;
      default:
        G.log(Consts.LOG_TYPE_SYS, 'ERROR: project ast import rejected - not processing');
        break;
    }
  }
  importCode(code)
  {
    switch (this.status)
    {
      case this.STATUSES.empty:
      case this.STATUSES.edit:
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
  getGraphs() {
    return this.graphs;
  }
  getAst()
  {
    return this.graphs.ast.graph;
  }
  getCode()
  {
    return this.code;
  }
  hasCode()
  {
    return this.state.hasCode;
  }
  hasAst()
  {
    return this.state.hasAst;
  }
  setAstStart(id)
  {
    this.nodeStart = id;
  }
  getAstStart()
  {
    return this.nodeStart;
  }
  
  setStatus(status)
  {
    if (Object.values(this.STATUSES).includes(status))
      this.status = status;
    else
      G.log(Consts.LOG_TYPE_SYS, `ERROR: "${status}" not valid project status`);
  }
  getStatus()
  {
    return this.status;
  }
  setName(name)
  {
    this.name = name;
  }
  getName()
  {
    return this.name;
  }
  setDirPath(dirPath)
  {
    this.dirPath = dirPath;
  }
  getDirPath()
  {
    return this.dirPath;
  }
}

module.exports = Project;
