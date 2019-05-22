import AbstractGraph from './AbstractGraph';
import ParentNode from './ParentNode';

class DefaultGraph extends AbstractGraph {
  processNode(data) {
    let node;
    switch (data.form) {
      default:
        node = new ParentNode(data.form, data.data, data.children, data.start, data.end);
        break;
    }
    return node;
  }
}

export default DefaultGraph;