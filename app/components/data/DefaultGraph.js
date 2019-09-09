import AbstractGraph from './AbstractGraph';
import ParentNode from './ParentNode';

class DefaultGraph extends AbstractGraph {
  processNode(children, data) {
    const { form, expr, astLink } = data;
    const asts = astLink || (expr ? [expr] : []);
    return new ParentNode(form, undefined, children, asts);
  }
}

export default DefaultGraph;