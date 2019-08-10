import AstGraph from './AstGraph';
import DefaultGraph from './DefaultGraph';
import SummaryGraph from './SummaryGraph';
import CodePos from './CodePos';
import Panel from './Panel';

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
      this.store = data.store;
      this.items = data.items;
      this.generateGraphs();
      this.generateMetadata();
      this.ast = data.ast;
      this.importAst(data.ast);
    }
  }
  export() {
    const filter = ['status', 'error', 'code', 'analysis', 'store', 'items', 'ast'];
    const data = Object.entries(this).reduce((accumulator, currentValue) => {
      const [prop, value] = currentValue;
      if (filter.includes(prop))
        accumulator[prop] = value;
      return accumulator;
    }, {});
    return data;
  }
  generateGraphs() {
    const { graphs, funcs, states, configs } = this.items;
    for (const [graphId, graphData] of Object.entries(graphs)) {
      switch (graphId) {
        case 'funcs':
          this.graphs[graphId] = new SummaryGraph(graphData, funcs);
          break;
        case 'states':
          this.graphs[graphId] = new DefaultGraph(graphData, configs);
          break;
        default:
          this.graphs[graphId] = new DefaultGraph(graphData, configs);
          break;
      }
    }

    this.mainGraphId = 'funcs';
  }
  generateMetadata() {
    this.generateConfigs();
    this.generateEnvs();
  }
  generateConfigs() {
    const items = this.items;
    const configs = {};
    Object.entries(items.configs)
      .forEach(([configId, config]) => {
        let syntax;
        const states = items.configs[configId].states;
        if (states) {
          const stateId = states[0];
          syntax = items.states[stateId].exprString;
        }
        const label = `${configId}: ${syntax}`;

        const configPanel = new Panel(label);

        configPanel.noItems = true;
        configPanel.noEnvs = true;

        const stateIds = config.states;
        if (stateIds) {
          configPanel.noItems = false;

          for (const stateId of stateIds) {
            const envId = items.states[stateId].env;
            if (envId)
              configPanel.noEnvs = false;
          }
        }
        configs[configId] = configPanel;
      });
    this.metadata.configs = configs;
  }
  generateEnvs() {
    const items = this.items;
    const envs = {};
    Object.keys(items.envs)
      .forEach(envId => envs[envId] = new Panel(envId));
    this.metadata.envs = envs;
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
    let graphId;
    if (graph) {
      const selectedNodes = graph.metadata.selectedNodes || [];
      const nodeId = selectedNodes[0];
      if (nodeId) {
        graphId = graph.nodes[nodeId].detail;
      } else
        graphId = 'states';
    }
    return graphId;
  }
}

export default Project;
