import { createSelector } from 'reselect';
import { getSelectedNodes, getHoveredNodes, getMainGraphId, getSubGraphId, getGraphRefData } from 'store-selectors';

const getSelectedAstsFactory = graphId => createSelector(
  state => getSelectedNodes(state, graphId),
  state => getGraphRefData(state, graphId),
  getNodeAsts
);
export const getSelectedAsts = createSelector(
  state => getSelectedAstsFactory(getMainGraphId(state))(state),
  state => getSelectedAstsFactory(getSubGraphId(state))(state),
  (mainGraphAsts, subGraphAsts) => {
    return [mainGraphAsts, subGraphAsts].flat();
  }
);

const getHoveredAstsFactory = graphId => createSelector(
  state => getHoveredNodes(state, graphId),
  state => getGraphRefData(state, graphId),
  getNodeAsts
);
export const getHoveredAsts = createSelector(
  state => getHoveredAstsFactory(getMainGraphId(state))(state),
  state => getHoveredAstsFactory(getSubGraphId(state))(state),
  (mainGraphAsts, subGraphAsts) => [mainGraphAsts, subGraphAsts].flat()
);

export function getNodeAsts(nodeIds, refData) {
  const astIds = new Set();
  if (refData)
    for (const nodeId of nodeIds) {
      const { astLink, expr } = refData[nodeId];
      let nodeAstIds = [];
      if (astLink)
        nodeAstIds = astLink;
      else if (expr)
        nodeAstIds = [expr];
      
      nodeAstIds.forEach(astId => astIds.add(astId));
    }
  return [...astIds];
}
