/**
 * NodeData generator.
 * Converts a graph node to cytoscape data format.
 * @param {String} id node id
 * @param {Object} data node data
 * @param {String} [data.form = ''] form
 * @param {Object} [data.style] style data
 * @returns {Object} cytoscape data
 */
function NodeData(id, data) {
  const { form = '', style, ...rest } = data;
  return {
    group: 'nodes',
    data: {
      id,
      label: `${id}\n${form}`,
      form,
      style,
      ...rest
    }
  };
}

export default NodeData;
