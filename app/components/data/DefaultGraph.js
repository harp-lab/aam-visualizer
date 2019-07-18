import AbstractGraph from './AbstractGraph';
import ParentNode from './ParentNode';

class DefaultGraph extends AbstractGraph {
  processNode(children, refData) {
    const { form, expr, astLink } = refData;
    const asts = astLink || (expr ? [expr] : []);
    return new ParentNode(form, undefined, children, asts);
  }
}

export default DefaultGraph;