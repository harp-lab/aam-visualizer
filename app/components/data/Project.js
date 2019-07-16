import AstGraph from './AstGraph';
import DefaultGraph from './DefaultGraph';
import SummaryGraph from './SummaryGraph';
import CodePos from './CodePos';

const GRAPHS = {
  ast: 'ast'
};

class Project {
  constructor() {
    this.code = '';
    this.graphs = {};
    this.metadata = {};

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
    this.status = data.status;
    this.error = data.error;
    
    this.code = data.code;
    this.analysis = data.analysis
    if (this.status == this.STATUSES.done) {
      //this.importGraphs(data.graphs);
      this.store = data.store;
      this.items = data.items;
      this.importGraphs2();
      this.importAst(data.ast);
    }
  }
  importGraphs(graphs) {
    for (const [id, data] of Object.entries(graphs)) {
      switch (id) {
        case 'funcs':
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

    this.mainGraphId = 'funcs';
  }
  importGraphs2() {
    for (const [graphId, graph] of Object.entries(this.items.graphs)) {
      switch (graphId) {
        case 'funcs':
          this.graphs[graphId] = new SummaryGraph(graph, this.items.funcs);
          break;
        case 'states':
          this.graphs[graphId] = new DefaultGraph(graph, this.items.states);
          break;
        default:
          this.graphs[graphId] = new DefaultGraph(graph, this.items.configs);
          break;
      }
    }
    console.log(this.graphs);
    this.mainGraphId = 'funcs';
  }
  importAst(ast) {
    const items = this.items;
    items.ast = {};
    for (const [id, data] of Object.entries(ast)) {
      if (data.start && data.end)
        items.ast[id] = {
          start: new CodePos(data.start[0], data.start[1]),
          end: new CodePos(data.end[0], data.end[1])
        };
    }
  }

  get mainGraph() { return this.graphs[this.mainGraphId]; }
  get subGraph() {
    let graph;
    if (this.subGraphId)
      graph = this.graphs[this.subGraphId];
    return graph;
  }
  get subGraphId() {
    const graph = this.mainGraph;
    const nodeId = graph.metadata.selectedNode;
    let graphId;
    if (nodeId)
      graphId = graph.nodes[nodeId].detail
    else
      graphId = 'states';
    return graphId;
  }
}

export default Project;
