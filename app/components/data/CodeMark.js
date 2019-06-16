class CodeMark {
  constructor(start, end) {
    this.start = start;
    this.end = end;
    this.nodes = {};
  }
  addNode(graphId, nodeId) {
    if (this.nodes[graphId])
      this.nodes[graphId].push(nodeId);
    else
      this.nodes[graphId] = [nodeId];
  }
  inRange(codePos) {
    const start = this.start;
    const end = this.end;
    const line = codePos.line;
    const ch = codePos.ch;

    const inLineRange = start.line <= line && line <= end.line;
    const inChRange = start.ch <= ch && ch < end.ch;
    let result = false;
    if (inLineRange && inChRange)
      result = true;
    return result;
  }
}

export default CodeMark;
