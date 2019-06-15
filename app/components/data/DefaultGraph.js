import AbstractGraph from './AbstractGraph';
import ParentNode from './ParentNode';

class DefaultGraph extends AbstractGraph {
  processNode(data) {
    let node;
    switch (data.form) {
      default:
        node = new ParentNode(data.form, data.data, data.children, data.astLink);
        node.env = data.env;
        node.states = data.states;
        break;
    }
    return node;
  }
}

export default DefaultGraph;