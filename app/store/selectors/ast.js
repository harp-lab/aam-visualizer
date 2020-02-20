import { createSelector } from 'reselect';
import { getSelectedNodes, getHoveredNodes, getGraphRefData } from 'store-selectors';
import { getViewedGraphIds } from './graphs.js';

const getSelectedAstsFactory = graphId => createSelector(
  state => getSelectedNodes(state, graphId),
  state => getGraphRefData(state, graphId),
  getNodeAsts
);

/**
 * @param {Object} state
 * @returns {Array} ast ids
 */
export const getSelectedAsts = createSelector(
  state => state,
  getViewedGraphIds,
  (state, graphIds) => {
    return Object
      .keys(graphIds)
      .map(graphId => getSelectedAstsFactory(graphId)(state))
      .flat();
  }
);

const getHoveredAstsFactory = graphId => createSelector(
  state => getHoveredNodes(state, graphId),
  state => getGraphRefData(state, graphId),
  getNodeAsts
);

/**
 * @param {Object} state
 * @returns {Array} ast ids
 */
export const getHoveredAsts = createSelector(
  state => state,
  getViewedGraphIds,
  (state, graphIds) => {
    return Object
      .keys(graphIds)
      .map(graphId => getHoveredAstsFactory(graphId)(state))
      .flat();
  }
);

export function getNodeAsts(nodeIds, refData) {
  const astIds = new Set();
  if (refData)
    for (const nodeId of nodeIds) {
      if (refData[nodeId]) {
        const { astLink, expr } = refData[nodeId];
        let nodeAstIds = [];
        if (astLink)
          nodeAstIds = astLink;
        else if (expr)
          nodeAstIds = [expr];
        
        nodeAstIds.forEach(astId => astIds.add(astId));
      }
    }
  return [...astIds];
}
