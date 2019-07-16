import AbstractGraph from './AbstractGraph';
import ParentNode from './ParentNode';

class DefaultGraph extends AbstractGraph {
  processNode(children, refData) {
    const { form, expr } = refData;
    return new ParentNode(form, undefined, children, expr);
  }
}

export default DefaultGraph;