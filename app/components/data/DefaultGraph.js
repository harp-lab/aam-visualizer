import AbstractGraph from './AbstractGraph';
import ParentNode from './ParentNode';

class DefaultGraph extends AbstractGraph {
  processNode(children, refData) {
    const { form, astLink } = refData;
    return new ParentNode(form, undefined, children, astLink);
  }
}

export default DefaultGraph;