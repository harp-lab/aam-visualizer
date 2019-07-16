import Edge from './Edge';

class AbstractGraph {
  constructor(data, refData) {
    this.nodes = {};
    this.edges = {};
    this.metadata = {};

    this.import(data.graph, refData);
    this.start = data.start;
  }


  processNode(data, refData) {}


  import(graphData, refData) {
    for (const [id, children] of Object.entries(graphData)) {
      const node = this.processNode(children, refData[id], id);
      
      // generate edges
      for (const [childId, edgeData] of Object.entries(children))
        this.edges[`${id}-${childId}`] = new Edge(id, childId, edgeData);
      
      this.nodes[id] = node;
    }
  }
  export() {
    const data = [];

    // export nodes
    for (const [id, node] of Object.entries(this.nodes))
      data.push(node.export(id));

    // export edges
    for (const [id, edge] of Object.entries(this.edges))
      data.push(edge.export(id));

    return data;
  }
  resetSelected() {
    this.metadata.selectedNode = undefined;
    this.metadata.selectedEdge = undefined;
  }
}

export default AbstractGraph;
