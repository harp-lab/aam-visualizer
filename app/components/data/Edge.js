class Edge {
  constructor(source, target, data) {
    this.source = source;
    this.target = target;

    this.label = data.label || '';
  }
  export(id) {
    return {
      data: {
        id: id,
        label: this.label,
        source: this.source,
        target: this.target
      }
    }
  }
}

export default Edge;