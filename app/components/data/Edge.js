class Edge {
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
}

export default Edge;