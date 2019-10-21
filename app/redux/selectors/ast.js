import { getProjectMetadata } from './projects';
import { getGraphSelectedNodes, getGraphHoveredNodes, getMainGraphId, getSubGraphId, getGraphRefData } from './graphs';

export function getSelectedAsts(store) {
  const graphIds = [getMainGraphId(store), getSubGraphId(store)];
  const astIds = graphIds.flatMap(graphId => {
    const selectedNodes = getGraphSelectedNodes(store, graphId);
    const refData = getGraphRefData(store, graphId);
    return getNodeAsts(selectedNodes, refData);
  });
  return astIds;
}
export function getHoveredAsts(store) {
  const graphIds = [getMainGraphId(store), getSubGraphId(store)];
  const astIds = graphIds.flatMap(graphId => {
    const hoveredNodes = getGraphHoveredNodes(store, graphId);
    const refData = getGraphRefData(store, graphId);
    return getNodeAsts(hoveredNodes, refData);
  });
  return astIds;
}
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
