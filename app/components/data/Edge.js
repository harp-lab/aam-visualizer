/*class Edge {
  constructor(source, target, data) {
    this.source = source;
    this.target = target;

    const { label, calls, style } = data;
    this.label = label || '';
    this.calls = calls;
    this.style = style;
  }
  export(id) {
    return {
      data: {
        id: id,
        label: this.label,
        source: this.source,
        target: this.target,
        style: this.style
      }
    }
  }
}*/

function Edge(id, source, target, data) {
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

export default Edge;
