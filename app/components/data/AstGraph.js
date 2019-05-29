import AbstractGraph from './AbstractGraph';
import ParentNode from './ParentNode';
import LeafNode from './LeafNode';

const NODES = {
  begin: 'begin',
  lambda: 'lambda',
  define: 'define',
  if: 'if',
  quote: 'quote',

  variable: 'variable',
  boolean: 'boolean',
  number: 'number'
}

class AstGraph extends AbstractGraph {
  processNode(data) {
    let node;
    switch (data.form) {
      case NODES.begin:
      case NODES.lambda:
      case NODES.define:
      case NODES.quote:
      case NODES.if:
        node = new ParentNode(data.form, data.data, data.children, data.start, data.end);
        break;
      case NODES.variable:
      case NODES.boolean:
      case NODES.number:
        node = new LeafNode(data.form, data.data, data.start, data.end);
        break;
      default:
        node = new LeafNode(data.form, data.data, data.start, data.end);
        break;
    }
    return node;
  }
}

export default AstGraph;
