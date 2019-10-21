import Node from './Node';
import Edge from './Edge';

function Graph(graphId, items) {
  const graphData = items.graphs[graphId];
  const { graph, start } = graphData;

  function exportGraph(graph, refData) {
    const data = [];
    for (const [nodeId, children] of Object.entries(graph)) {
      let form;
      if (refData) form = refData[nodeId].form;
      data.push(Node(nodeId, form));

      for (const [childId, edge] of Object.entries(children)) {
        if (refData) form = refData[childId].form;
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
    case 'states': {
      return exportGraph(graph, items.states);
    }
    default: {
      return exportGraph(graph, items.configs);
    }
  }
}

export default Graph;
