import AbstractGraph from './AbstractGraph';
import ParentNode from './ParentNode';
import LeafNode from './LeafNode';

const NODES = {
  begin: 'begin',
  define: 'define',
  if: 'if',
  quote: 'quote'
}

class AstGraph extends AbstractGraph {
  processNode(data) {
    let node;
    switch (data.form) {
      case NODES.begin:
      case NODES.define:
      case NODES.quote:
      case NODES.if:
        node = new ParentNode(data.form, data.data, data.children, data.start, data.end);
        break;
      default:
        node = new LeafNode(data.form, data.data, data.start, data.end);
        break;
    }
    return node;
  }
}

export default AstGraph;
