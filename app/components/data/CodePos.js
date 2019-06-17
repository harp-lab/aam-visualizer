class CodePos {
  constructor(line, ch) {
    this.line = line;
    this.ch = ch;
  }
  toString() { return `line ${this.line} ch ${this.ch}`; }
}

export default CodePos;
