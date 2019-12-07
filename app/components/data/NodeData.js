/**
 * NodeData generator.
 * Converts a graph node to cytoscape data format.
 * @param {String} id node id
 * @param {String} form node form
 * @returns {Object} cytoscape data
 */
function NodeData(id, form = '') {
  return {
    group: 'nodes',
    data: {
      id,
      label: `${id}\n${form}`,
      form
    }
  };
}

export default NodeData;
