import AbstractGraph from './AbstractGraph';
import ParentNode from './ParentNode';

class SummaryGraph extends AbstractGraph {
  processNode(data, refData, id) {
    let node;
    switch (refData.form) {
      case 'halt':
      case 'exit':
      case 'no-return':
        node = new ParentNode(refData.form, undefined, data, refData.expr);
        break;
      default:
        node = new ParentNode(refData.form, undefined, data, refData.expr);
        node.detail = id;
        break;
    }
    return node;
  }
}

export default SummaryGraph;