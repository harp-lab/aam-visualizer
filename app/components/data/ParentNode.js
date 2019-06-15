import LeafNode from './LeafNode';

class ParentNode extends LeafNode {
  constructor(form, data, children, astLink) {
    super(form, data, astLink);
    this.children = children;
  }
}

export default ParentNode;
