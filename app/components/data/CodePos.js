class CodePos {
  constructor(line, ch) {
    this.line = line;
    this.ch = ch;
  }
  toString() { return `line ${this.line} char ${this.ch}`; }
}

export default CodePos;
