/**
 * EdgeData generator.
 * Converts a graph edge to cytoscape data format.
 * @param {String} id edge id
 * @param {String} source source node id
 * @param {String} target target node id
 * @param {Object} data edge data
 * @param {String} [data.label = ''] label
 * @param {Object} data.style style data
 * @returns {Object} cytoscape data
 */
function EdgeData(id, source, target, data) {
  const { label = '', style } = data;
  return {
    group: 'edges',
    data: {
      id,
      label,
      source,
      target,
      style
    }
  }
}

export default EdgeData;
