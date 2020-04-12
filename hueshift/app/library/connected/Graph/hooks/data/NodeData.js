/**
 * NodeData generator.
 * Converts a graph node to cytoscape data format.
 * @param {String} id node id
 * @param {Object} data node data
 * @returns {Object} cytoscape data
 */
function NodeData(id, data) {
  return {
    group: 'nodes',
    data: {
      id,
      label: id,
      ...data
    }
  };
}

export default NodeData;
