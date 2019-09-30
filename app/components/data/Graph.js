import Node from './Node';
import Edge from './Edge';

function Graph(graphId, items) {
  const graphData = items.graphs[graphId];
  const { graph, start } = graphData;

  function exportGraph(graph, refData) {
    const data = [];
    for (const [nodeId, children] of Object.entries(graph)) {
      const { form } = refData[nodeId];
      data.push(Node(nodeId, form));

      for (const [childId, edge] of Object.entries(children)) {
        const { form } = refData[childId];
        data.push(Node(childId, form));
        const edgeId = `${nodeId}-${childId}`;
        data.push(Edge(edgeId, nodeId, childId, edge));
      }
    }
    return data;
  }

  switch (graphId) {
    case 'funcs': {
      return exportGraph(graph, items.funcs);
    }
    case 'states':
    default: {
      return exportGraph(graph, items.configs);
    }
  }
}

export default Graph;
