import { createSelector } from 'reselect';
import { getGraphs, getGraphMetadata, getProjectAnalysisOutput } from 'store/selectors';

/**
 * @param {String} graphId graph id
 */
export function getBubbledGraphId(graphId) {
  return `bubbled-${graphId}`;
}

/**
 * Get bubbled graph
 * @param {Object} state
 * @param {String} graphId graph id
 * @returns {Object} bubbled graph, undefined if unavailable
 */
export const getBubbledGraph = createSelector(
  (state, graphId) => getGraphs(state),
  (state, graphId) => getBubbledGraphId(graphId),
  (graphs, bubbledGraphId) => graphs[bubbledGraphId]
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
 * Get graph id based on ui toggles
 * @param {Object} state
 * @param {String} graphId graph id
 * @returns {String} graph id
 */
export const getToggleGraphId = createSelector(
  (state, graphId) => graphId,
  (state, graphId) => getBubbling(state, graphId),
  (state, graphId) => getBubbledGraphId(graphId),
  (graphId, bubbled, bubbledGraphId) => {
    let toggleGraphId = graphId;
    if (bubbled)
      toggleGraphId = bubbledGraphId;
    return toggleGraphId;
  }
);

/**
 * Get reference data for graph nodes
 * @param {String} graphId graph id
 */
export const getGraphRefData = createSelector(
  (state, graphId) => graphId,
  (state, graphId) => getProjectAnalysisOutput(state),
  (graphId, analOut) => {
    let refData;
    switch (graphId) {
      case 'funcs':
        refData = analOut.funcs;
        break;
      case 'states':
      default:
        refData = analOut.configs;
        break;
    }

    return refData;
  }
);
