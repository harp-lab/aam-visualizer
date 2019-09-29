import { getProjectItems, getProjectMetadata } from './projects';


export function getGraphs(store) {
  return getProjectItems(store).graphs;
}
export function getGraphsMetadata(store) {
  return getProjectMetadata(store).graphs;
}


export function getMainGraphId(store) {
  return getProjectMetadata(store).data.mainGraphId || 'funcs';
}
export function getSubGraphId(store) {
  const mainGraphId = getMainGraphId(store);
  const selectedNodes = getGraphSelectedNodes(store, mainGraphId);

  let subGraphId = 'states';
  if (selectedNodes.length > 0) {
    const nodeId = selectedNodes[0];
    const items = getProjectItems(store);
  
    const { form } = items.funcs[nodeId];
    const finalForms = ['halt', 'not found', 'non-func', 'unknown'];
    if (!finalForms.includes(form))
      subGraphId = nodeId;
  }
  return subGraphId;
}
export function getFocusedGraph(store) {
  const defaultGraph = getMainGraphId(store);
  return getProjectMetadata(store).data.focusedGraph || defaultGraph;
}

export function getGraph(store, graphId) {
  return getGraphs(store)[graphId];
}
export function getMainGraph(store) {
  return getGraphs(store)[getMainGraphId(store)];
}
export function getSubGraph(store) {
  return getGraphs(store)[getSubGraphId(store)];
}

export function getGraphMetadata(store, graphId) {
  return getGraphsMetadata(store)[graphId] || {};
}
export function getGraphSelectedNodes(store, graphId) {
  return getGraphMetadata(store, graphId).selectedNodes || {};
}
