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
      done: 'done'
    };
    this.status = this.STATUSES.empty;
  }
  importGraphs(graphs) {
    for (const [type, data] of Object.entries(graphs)) {
      switch (type) {
        case GRAPHS.ast:
        case 'fakeGraphType':
          this.graphs[type] = new AstGraph(data);
          break;
        case GRAPHS.state:
          this.graphs[type] = new StateGraph(data);
          break;
      }
    }
  }
}

export default Project;
