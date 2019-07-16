import Edge from './Edge';

class AbstractGraph {
  constructor(data, refData) {
    this.nodes = {};
    this.edges = {};
    this.metadata = {};

    this.import(data.graph, refData);
    this.start = data.start;
    if (data.subGraphType)
      this.subGraphType = data.subGraphType;
    this.metadata = {
      selectedNode: undefined
    };
  }


  processNode(data, refData) {}


  import(graphData, refData) {
    for (const [id, data] of Object.entries(graphData)) {
      const node = this.processNode(data, refData[id], id);
      
      const children = node.children;
      if (children) {
        for (const [childId, edgeData] of Object.entries(children))
          this.edges[`${id}-${childId}`] = new Edge(id, childId, edgeData);
      }
      
      this.nodes[id] = node;
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
    //this.metadata.selectedNode = this.start;
    this.metadata.selectedNode = undefined;
    this.metadata.selectedEdge = undefined;
  }
}

export default AbstractGraph;
