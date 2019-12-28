import store from '../store';
import { setMetadata, refresh } from 'store-actions';
import { getSelectedProjectId, getGraph, getMainGraphId, getSelectedNodes, getBubbling } from 'store-selectors';
import { SET_GRAPH_METADATA } from '../actionTypes';

export function setMainGraphId(graphId) {
  const state = store.getState();
  const projectId = getSelectedProjectId(state);
  return setMetadata(projectId, {
    mainGraphId: graphId
  });
}
export function setFocusedGraph(graphId) {
  const state = store.getState();
  const projectId = getSelectedProjectId(state);
  return setMetadata(projectId, {
    focusedGraph: graphId
  });
}
export function setGraphMetadata(graphId, data) {
  const state = store.getState();
  const projectId = getSelectedProjectId(state);
  return {
    type: SET_GRAPH_METADATA,
    payload: { projectId, graphId, data }
  };
}
export function selectNodes(graphId, nodeIds) {
  return (dispatch, getState) => {
    const state = getState();
    const selectedNodes = getSelectedNodes(state, graphId);
    const combinedNodes = new Set([...selectedNodes, ...nodeIds]);
    dispatch(setGraphMetadata(graphId, {
      selectedNodes: [...combinedNodes]
    }));
    dispatch(refresh());
  };
}
export function unselectNodes(graphId, nodeIds) {
  return (dispatch, getState) => {
    const state = getState();
    const selectedNodes = getSelectedNodes(state, graphId);
    const combinedNodes = new Set(selectedNodes);
    nodeIds.forEach(nodeId => combinedNodes.delete(nodeId));
    dispatch(setGraphMetadata(graphId, {
      selectedNodes: [...combinedNodes]
    }));
    dispatch(refresh());
  };
}
export function hoverNodes(graphId, nodeIds) {
  return setGraphMetadata(graphId, {
    hoveredNodes: nodeIds
  });
}
export function suggestNodes(graphId, nodeIds) {
  return setGraphMetadata(graphId, {
    suggestedNodes: nodeIds
  });
}
export function selectEdges(graphId, edgeIds) {
  return (dispatch, getState) => {
    dispatch(setGraphMetadata(graphId, {
      selectedEdges: edgeIds
    }));

    const state = getState();
    const { graph } = getGraph(state, graphId);
    const mainGraphId = getMainGraphId(state);

    const suggestedNodes = new Set();
    for (const edgeId of edgeIds) {
      const [nodeId, childId] = edgeId.split('-');
      const edgeData = graph[nodeId][childId];
      const { calls } = edgeData;
      if (calls)
        for (const nodeId of calls) {
          suggestedNodes.add(nodeId);
        }
    }
    dispatch(suggestNodes(mainGraphId, [...suggestedNodes]));
  };
}
export function setPositions(graphId, positions) {
  return setGraphMetadata(graphId, { positions });
}

/**
 * Toggle bubbling state of graph
 * @param {String} graphId 
 */
export function toggleBubbling(graphId) {
  const state = store.getState();
  const bubbled = getBubbling(state, graphId);
  return setGraphMetadata(graphId, { bubbled: !bubbled });
}
