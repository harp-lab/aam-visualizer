import AbstractGraph from './AbstractGraph';
import ParentNode from './ParentNode';

class DefaultGraph extends AbstractGraph {
  processNode(data, refData, id) {
    let node;
    switch (refData.form) {
      default:
        node = new ParentNode(refData.form, undefined, data, refData.expr);
        break;
    }
    return node;
  }
}

export default DefaultGraph;