import AbstractGraph from './AbstractGraph';
import ParentNode from './ParentNode';

const finalForms = ['halt', 'not found', 'non-func', 'unknown'];

class SummaryGraph extends AbstractGraph {
  processNode(children, refData, nodeId) {
    const {form, expr } = refData;
    const node = new ParentNode(form, undefined, children, expr);

    if (!finalForms.includes(form))
      node.detail = nodeId; // nodeId matches graphId

    return node;
  }
}

export default SummaryGraph;