import NodeData from './NodeData';
import EdgeData from './EdgeData';

/**
 * GraphData generator.
 * Converts an items graph adjacency list to cytoscape data format.
 * @function
 * @param {String} graphId graph id
 * @param {Object} items project items object
 * @returns {Array} cytoscape data
 */
function GraphData(graphId, items) {
  const graphData = items.graphs[graphId];
  const { graph, start } = graphData;

  // get graph data from ref data
  function exportGraph(graph, refData) {
    const data = [];
    for (const [nodeId, children] of Object.entries(graph)) {
      const form = getForm(nodeId, refData);
      data.push(NodeData(nodeId, form));

      for (const [childId, edge] of Object.entries(children)) {
        const form = getForm(childId, refData);
        data.push(NodeData(childId, form));
        const edgeId = `${nodeId}-${childId}`;
        data.push(EdgeData(edgeId, nodeId, childId, edge));
      }
    }
    return data;
  }

  // get node form from ref data
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

export default GraphData;
