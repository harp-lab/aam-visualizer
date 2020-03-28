import { createSelector } from 'reselect';
import { getProjectAnalysisOutput, getProjectMetadata } from './projects';

export const getGraphs = createSelector(
  state => getProjectAnalysisOutput(state),
  analysisOutput => analysisOutput.graphs
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

/**
 * @param {Object} state
 * @param {String} graphId graph id
 * @returns {Array<String>} selected node ids
 */
export const getSelectedNodes = createSelector(
  getGraphMetadata,
  metadata => metadata.selectedNodes || []
);

/**
 * @param {Object} state
 * @param {String} graphId graph id
 * @returns {Array<String>} selected edge ids
 */
export const getSelectedEdges = createSelector(
  getGraphMetadata,
  metadata => metadata.selectedEdges || []
);

/**
 * @param {Object} state
 * @param {String} graphId graph id
 * @returns {Array<String>} hovered node ids
 */
export const getHoveredNodes = createSelector(
  getGraphMetadata,
  metadata => metadata.hoveredNodes || []
);

/**
 * @param {Object} state
 * @param {String} graphId graph id
 * @returns {Array<String>} suggested node ids
 */
export const getSuggestedNodes = createSelector(
  getGraphMetadata,
  metadata => metadata.suggestedNodes || []
);

/**
 * @param {Object} state
 * @param {String} graphId graph id
 */
export const getGraphPositions = createSelector(
  (state, graphId) => getGraphMetadata(state, graphId),
  metadata => metadata.positions
);

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
 * @param {Object} state
 * @returns {String} focused graph id
 */
export const getFocusedGraph = createSelector(
  state => getProjectMetadata(state),
  metadata => metadata.focusedGraph
);

/**
 * @param {String} graphId graph id to check
 * @returns {Boolean} graph id is focused
 */
export const isFocusedGraph = createSelector(
  (state, graphId) => graphId,
  (state, graphId) => getFocusedGraph(state),
  (graphId, focusedGraphId) => graphId === focusedGraphId
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
  (state, graphId) => getGraphs(state),
  (state, graphId) => graphId,
  (graphs, graphId) => graphs[graphId]
);

/**
 * Get graph reference data
 * @param {Object} state
 * @param {String} graphId graphId
 * @returns {Object} graph reference data
 */
export const getGraphRefData = createSelector(
  (state, graphId) => getProjectAnalysisOutput(state),
  (state, graphId) => graphId,
  (analysisOutput, graphId) => {
    switch (graphId) {
      case 'funcs':
        return analysisOutput.funcs;
      case 'states':
      default:
        return analysisOutput.configs;
    }
  }
);
