class Edge {
  constructor(source, target, data) {
    this.source = source;
    this.target = target;

    this.label = data.label || '';
    this.calls = data.calls;
    this.style = data.style;
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