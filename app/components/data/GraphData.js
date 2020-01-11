import NodeData from './NodeData';
import EdgeData from './EdgeData';

/**
 * Converts an items graph adjacency list to cytoscape data format.
 * @param {Object} graphData graph data
 * @param {Object} items project items object
 * @returns {Array} cytoscape data
 */
function GraphData(graphData, refData) {
  let { graph, start } = graphData;

  /**
   * Convert graph data to cytoscape data
   * @param {Object} graphData graph data
   * @param {Object} refData node reference data
   * @returns {Array} cytoscape data
   */
  function exportGraph(graphData, refData) {
    const { graph, start } = graphData;
    const data = [];
    for (const [nodeId, children] of Object.entries(graph)) {
      const nodeData = {
        form: getForm(nodeId, refData)
      };
      if (start.includes(nodeId))
        nodeData.entrypoint = true;
      data.push(NodeData(nodeId, nodeData));

      for (const [childId, edge] of Object.entries(children)) {
        if (!graph[childId]) {
          const nodeData = {
            form: getForm(nodeId, refData)
          };
          if (start.includes(nodeId))
            nodeData.entrypoint = true;
          data.push(NodeData(nodeId, nodeData));
        }
        const edgeId = `${nodeId}-${childId}`;
        data.push(EdgeData(edgeId, nodeId, childId, edge));
      }
    }
    return data;
  }

  /**
   * Get node from from refence data
   * @param {String} nodeId node id
   * @param {Object} refData node reference data
   * @returns {String} node form
   */
  function getForm(nodeId, refData) {
    let form;
    if (refData) {
      const nodeRef = refData[nodeId];
      if (nodeRef) form = nodeRef.form;
    }
    return form;
  }

  const cyData = exportGraph(graphData, refData);
  return cyData;
}

export default GraphData;
