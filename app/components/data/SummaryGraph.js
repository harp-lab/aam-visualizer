import AbstractGraph from './AbstractGraph';
import ParentNode from './ParentNode';

class SummaryGraph extends AbstractGraph {
  processNode(data) {
    let node;
    switch (data.form) {
      default:
        node = new ParentNode(data.form, data.data, data.children, data.start, data.end);
        node.detail = data.detail;
        break;
    }
    return node;
  }
}

export default SummaryGraph;