import AstGraph from './AstGraph';
import StateGraph from './StateGraph';

const GRAPHS = {
  ast: 'ast',
  state: 'state'
};

class Project {
  constructor() {
    this.code = '';
    this.graphs = {};

    this.STATUSES = {
      empty: 'empty',
      edit: 'edit',
      process: 'process',
      done: 'done',
      error: 'error'
    };
    this.status = this.STATUSES.empty;
  }
  importGraphs(graphs) {
    for (const [id, data] of Object.entries(graphs)) {
      const type = data.type;
      switch (type) {
        case GRAPHS.ast:
          this.graphs[id] = new AstGraph(data);
          break;
        case GRAPHS.state:
          this.graphs[id] = new StateGraph(data);
          break;
      }
    }
  }
}

export default Project;
