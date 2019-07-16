import CodePos from './CodePos';

class LeafNode {
  constructor(form, data, expr) {
    this.form = form;
    this.data = data;
    this.expr = expr;
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
