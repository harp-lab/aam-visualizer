import CodePos from './CodePos';

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
  in(pos, start, end) {
    const inLine = start.line <= pos.line && pos.line <= end.line;
    const inCh = start.ch <= pos.ch && pos.ch < end.ch;
    let result = false;
    if (inLine && inCh)
      result = true;
    return result;
  }
  startsIn(start, end) { return this.in(this.start, start, end); }
  endsIn(start, end) {
    return this.in(new CodePos(this.end.line, this.end.ch - 1), start, end);
  }
  includes(start, end) {
    // shift end to be properly included
    const startIn = this.in(start, this.start, this.end);
    const endIn = this.in(new CodePos(end.line, end.ch - 1), this.start, this.end);
    return startIn && endIn;
  }
  has(pos) { return this.in(pos, this.start, this.end); }
  smallerThan(mark) {
    const lessLines = (this.end.line - this.start.line) < (mark.end.line - mark.start.line);
    const lessCh = (this.end.ch - this.start.ch) < (mark.end.ch - mark.start.ch);
    return lessLines || (!lessLines && lessCh);
  }
  coverage(start, end) {
    let coverageStart, coverageEnd;
    const included = this.includes(start, end);
    if (this.startsIn(start, end))
      coverageStart = this.start;
    else if (included)
      coverageStart = start;
    
    if (this.endsIn(start, end))
      coverageEnd = this.end;
    else if (included)
      coverageEnd = end;
    
    let length;
    if (coverageStart && coverageEnd)
      length = coverageEnd.ch - coverageStart.ch;
    else
      length = 0;
    return length;
  }
}

export default CodeMark;
