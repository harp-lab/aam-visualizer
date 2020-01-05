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
   * @param {Object} graph graph adjacency list
   * @param {Object} refData node reference data
   * @returns {Array} cytoscape data
   */
  function exportGraph(graph, refData) {
    const data = [];
    for (const [nodeId, children] of Object.entries(graph)) {
      const form = getForm(nodeId, refData);
      data.push(NodeData(nodeId, { form }));

      for (const [childId, edge] of Object.entries(children)) {
        const form = getForm(childId, refData);
        data.push(NodeData(childId, { form }));
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

  /**
   * Add hidden nodes with edges to graph entrypoints
   * @param {Object} data cytoscape data
   */
  function addEntryEdges(data) {
    if (start) {
      if (!(start instanceof Array)) 
        start = [start];
      for (const nodeId of start) {
        const entryId = `start-${nodeId}`;
        const nodeData = NodeData(entryId, {
          style: {
            visibility: 'hidden'
          }
        });
        data.push(nodeData);
        const edgeId = `${entryId}-${nodeId}`;
        const edgeData = {
          style: {
            'line-color': '#3f51b5',
            'target-arrow-color': '#3f51b5'
          }
        };
        data.push(EdgeData(edgeId, entryId, nodeId, edgeData));
      }
    }
  }

  const cyData = exportGraph(graph, refData);
  addEntryEdges(cyData);
  return cyData;
}

export default GraphData;
