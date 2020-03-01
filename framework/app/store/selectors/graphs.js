import { createSelector } from 'reselect';
import { getProjectItems } from 'store/selectors';
import { getProjectMetadata } from './projects';

export const getGraphs = createSelector(
  state => getProjectItems(state),
  items => items.graphs
);
export const getGraphIds = createSelector(
  state => getGraphs(state),
  graphs => Object.keys(graphs)
);

/**
 * @param {Object} state
 * @param {String} [projectId = <current project id>] project id
 * @returns {Object} graph metadata
 */
export const getGraphsMetadata = createSelector(
  getProjectMetadata,
  metadata => metadata.graphs
);

/**
 * @param {Object} state
 * @param {String} graphId graph id
 * @param {String} [projectId = <current project id>] project id
 * @returns {Object} metadata
 */
export const getGraphMetadata = createSelector(
  (state, graphId, projectId) => graphId,
  (state, graphId, projectId) => getGraphsMetadata(state, projectId),
  (graphId, metadata) => metadata[graphId] || {}
);

export const getSelectedNodes = (store, graphId) => getGraphMetadata(store, graphId).selectedNodes || [];
export const getHoveredNodes = (store, graphId) => getGraphMetadata(store, graphId).hoveredNodes || [];
export const getSelectedEdges = (store, graphId) => getGraphMetadata(store, graphId).selectedEdges || [];

/**
 * @param {Object} state
 * @param {String} graphId graph id
 * @param {String} [projectId = <current project id>] project id
 * @returns {Number} active graph viewers
 */
export const getGraphViewers = createSelector(
  getGraphMetadata,
  metadata => metadata.viewers || 0
);

/**
 * @param {Object} state
 * @returns {Object} <{String} graphId, {Boolean} viewed> hashmap
 */
export const getViewedGraphIds = createSelector(
  getGraphsMetadata,
  graphs => {
    const viewedGraphs = {};
    for (const [graphId, metadata] of Object.entries(graphs)) {
      const { viewers } = metadata;
      if (viewers > 0)
        viewedGraphs[graphId] = true;
    }
    return viewedGraphs;
  }
);

/**
 * Get bubbled graph
 * @param {Object} state
 * @param {String} graphId graph id
 * @returns {Object} bubbled graph, undefined if unavailable
 */
export const getBubbledGraph = createSelector(
  getGraphs,
  (state, graphId) => graphId,
  (graphs, graphId) => {
    const { bubbled: bubbledGraphs } = graphs;
    if (bubbledGraphs && bubbledGraphs[graphId])
      return bubbledGraphs[graphId];
    else
      return undefined;
  }
);

/**
 * Get bubbled state of graph
 * @param {Object} state
 * @param {String} graphId graph id
 * @returns {Boolean} graph bubbled state, undefined if unavailable
 */
export const getBubbling = createSelector(
  getBubbledGraph,
  getGraphMetadata,
  (graph, metadata) => {
    const { bubbled } = metadata;
    if (graph && bubbled === undefined)
      return true
    else
      return bubbled;
  }
);

/**
 * Get main graph id
 * @param {Object} state
 * @returns {String} main graph id
 */
export const getMainGraphId = createSelector(
  state => getProjectMetadata(state),
  metadata => metadata.mainGraphId || 'funcs'
);

/**
 * Get sub graph id
 * @param {Object} state
 * @returns {String} sub graph id
 */
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

/**
 * Get graph data
 * @param {Object} state
 * @param {String} graphId graph id
 * @returns {Object} graph data
 */
export const getGraph = createSelector(
  getGraphs,
  (state, graphId) => graphId,
  getBubbling,
  getBubbledGraph,
  (graphs, graphId, bubbled, bubbledGraph) => {
    if (bubbled)
      return bubbledGraph;
    else
      return graphs[graphId];
  }
);

/**
 * Get graph reference data
 * @param {Object} state
 * @param {String} graphId graphId
 * @returns {Object} graph reference data
 */
export const getGraphRefData = createSelector(
  (state, graphId) => getProjectItems(state),
  (state, graphId) => graphId,
  (items, graphId) => {
    switch (graphId) {
      case 'funcs':
        return items.funcs;
      case 'states':
      default:
        return items.configs;
    }
  }
);
