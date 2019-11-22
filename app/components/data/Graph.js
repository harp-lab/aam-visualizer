import Node from './Node';
import Edge from './Edge';

function Graph(graphId, items) {
  const graphData = items.graphs[graphId];
  const { graph, start } = graphData;

  function exportGraph(graph, refData) {
    const data = [];
    for (const [nodeId, children] of Object.entries(graph)) {
      const form = getForm(nodeId, refData);
      data.push(Node(nodeId, form));

      for (const [childId, edge] of Object.entries(children)) {
        const form = getForm(childId, refData);
        data.push(Node(childId, form));
        const edgeId = `${nodeId}-${childId}`;
        data.push(Edge(edgeId, nodeId, childId, edge));
      }
    }
    return data;
  }
  function getForm(nodeId, refData) {
    let form;
    if (refData) {
      const nodeRef = refData[nodeId];
      if (nodeRef) form = nodeRef.form;
    }
    return form;
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
