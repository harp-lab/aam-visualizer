import CodePos from './CodePos';

class LeafNode {
  constructor(form, data, start, end) {
    this.form = form;
    this.data = data;
    if (start && end) {
      this.start = new CodePos(start[0], start[1]);
      this.end = new CodePos(end[0], end[1]);
    }
  }
  export(id) {
    return {
      data: {
        id: id,
        label: `${id}\n${this.form}`,
        form: this.form
      }
    };
  }
}

export default LeafNode;
