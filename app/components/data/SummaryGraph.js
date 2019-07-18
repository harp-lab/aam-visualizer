import AbstractGraph from './AbstractGraph';
import ParentNode from './ParentNode';

const finalForms = ['halt', 'not found', 'non-func', 'unknown'];

class SummaryGraph extends AbstractGraph {
  processNode(children, refData, nodeId) {
    const {form, expr, astLink } = refData;
    const asts = astLink || (expr ? [expr] : []);
    const node = new ParentNode(form, undefined, children, asts);

    if (!finalForms.includes(form))
      node.detail = nodeId; // nodeId matches graphId

    return node;
  }
}

export default SummaryGraph;