import { createSelector } from 'reselect';
import { getProjectItems, getProjectMetadata } from 'store-selectors';

export const getGraphs = createSelector(
  state => getProjectItems(state),
  items => items.graphs
);
export const getGraphsMetadata = createSelector(
  state => getProjectMetadata(state),
  metadata => metadata.graphs
);

export const getMainGraphId = createSelector(
  state => getProjectMetadata(state),
  metadata => metadata.mainGraphId || 'funcs'
);
export const getSubGraphId = createSelector(
  state => getSelectedNodes(state, getMainGraphId(state)),
  state => getProjectItems(state),
  (selectedNodes, items) => {
    let subGraphId = 'states';
    if (selectedNodes.length > 0) {
      const nodeId = selectedNodes[0];
      const { form } = items.funcs[nodeId];
      const finalForms = ['halt', 'not found', 'non-func', 'unknown'];
      if (!finalForms.includes(form))
        subGraphId = nodeId;
    }
    return subGraphId;
  }
);
export const getFocusedGraph = createSelector(
  state => getProjectMetadata(state),
  getMainGraphId,
  (metadata, mainGraphId) => metadata.focusedGraph || mainGraphId
);
export function getGraphNodes(store, graphId) {
  const { graph } = getGraph(store, graphId);
  const nodeIds = [];
  for (const [nodeId, children] of Object.entries(graph)) {
    nodeIds.push(nodeId);
    nodeIds.concat(Object.keys(children));
  }
  return nodeIds;
}

export const getGraph = (store, graphId) => getGraphs(store)[graphId];
export const getMainGraph = createSelector(
  getGraphs,
  getMainGraphId,
  (graphs, graphId) => graphs[graphId]
);
export const getSubGraph = createSelector(
  getGraphs,
  getSubGraphId,
  (graphs, graphId) => graphs[graphId]
);

export const getGraphMetadata = (store, graphId) => getGraphsMetadata(store)[graphId] || {};
export const getSelectedNodes = (store, graphId) => getGraphMetadata(store, graphId).selectedNodes || [];
export const getHoveredNodes = (store, graphId) => getGraphMetadata(store, graphId).hoveredNodes || [];
export const getSelectedEdges = (store, graphId) => getGraphMetadata(store, graphId).selectedEdges || [];
export function getGraphRefData(store, graphId) {
  const items = getProjectItems(store);
  switch (graphId) {
    case 'funcs':
      return items.funcs;
    case 'states':
    default:
      return items.configs;
  }
}