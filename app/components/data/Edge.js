/**
 * EdgeData generator.
 * Converts a graph edge to cytoscape data format.
 * @param {String} id 
 * @param {String} source 
 * @param {String} target 
 * @param {Object} data 
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
