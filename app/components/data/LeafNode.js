import CodePos from './CodePos';

class LeafNode {
  constructor(form, data, astLink) {
    this.form = form;
    this.data = data;
    this.astLink = astLink;
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
