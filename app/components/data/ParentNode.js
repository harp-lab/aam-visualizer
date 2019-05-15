import LeafNode from './LeafNode';

class ParentNode extends LeafNode {
  constructor(form, data, children, start, end) {
    super(form, data, start, end);
    this.children = children;
  }
}

export default ParentNode;
