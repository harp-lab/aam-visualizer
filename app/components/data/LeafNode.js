import CodePos from './CodePos';

class LeafNode {
  constructor(form, data, asts) {
    this.form = form;
    this.data = data;
    this.asts = asts;
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
