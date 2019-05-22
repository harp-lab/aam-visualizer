import AstGraph from './AstGraph';
import DefaultGraph from './DefaultGraph';
import SummaryGraph from './SummaryGraph';

const GRAPHS = {
  ast: 'ast'
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
      switch (id) {
        case 'main':
          this.graphs[id] = new SummaryGraph(data);
          break;
        default:
          const type = data.type;
          switch (type) {
            case GRAPHS.ast:
              this.graphs[id] = new AstGraph(data);
              break;
            default:
              this.graphs[id] = new DefaultGraph(data);
              break;
          }
          break;
      }
    }
  }
}

export default Project;
