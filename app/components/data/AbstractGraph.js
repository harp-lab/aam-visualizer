import Edge from './Edge';

class AbstractGraph {
  constructor(data) {
    this.nodes = {};
    this.edges = {};
    this.metadata = {};

    this.import(data.graph);
    this.start = data.start;
    this.metadata = {
      selectedNode: this.start
    };
  }


  processNode(data) {}


  import(graph) {
    for (const [id, data] of Object.entries(graph)) {
      const node = this.processNode(data);
      this.nodes[id] = node;
      
      const children = node.children;
      if (children) {
        for (const [childId, edgeData] of Object.entries(children))
          this.edges[`${id}-${childId}`] = new Edge(id, childId, edgeData);
      }
    }
  }
  export() {
    let data = [];
    for (const [id, node] of Object.entries(this.nodes)) {
      data.push(node.export(id));
    }
    for (const [id, edge] of Object.entries(this.edges)) {
      data.push(edge.export(id));
    }
    return data;
  }
  resetSelected() {
    this.metadata.selectedNode = this.start;
    this.metadata.selectedEdge = undefined;
  }
}

export default AbstractGraph;
