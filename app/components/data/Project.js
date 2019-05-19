import AstGraph from './AstGraph';
import MainGraph from './MainGraph';

const GRAPHS = {
  ast: 'ast',
  main: 'main'
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
    for (const [type, data] of Object.entries(graphs)) {
      switch (type) {
        case GRAPHS.ast:
        case 'fakeGraphType':
          this.graphs[type] = new AstGraph(data);
          break;
        case GRAPHS.main:
          this.graphs[type] = new MainGraph(data);
          break;
      }
    }
  }
}

export default Project;
