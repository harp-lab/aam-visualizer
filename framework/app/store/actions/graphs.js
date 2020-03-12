import store from 'store';
import { SET_GRAPH_METADATA } from 'store/actionTypes';
import { setMetadata } from 'store/actions';
import { getSelectedProjectId, getGraphViewers, getSelectedNodes } from 'store/selectors';

import { nodeSelectHook, nodeUnselectHook } from 'extensions/store/hooks';

/**
 * @param {String} graphId graph id
 * @param {Number} viewers active graph viewers
 * @param {String} [projectId = <current project id>] project id
 * @returns {Object} action
 */
export function setGraphViewers(graphId, viewers, projectId) {
  return setGraphMetadata(graphId, { viewers }, projectId);
}

/**
 * @param {String} graphId graph id
 * @returns {Object} action
 */
export function addGraphViewer(graphId) {
  const state = store.getState();
  const viewers = getGraphViewers(state, graphId);
  return setGraphViewers(graphId, viewers + 1);
}

/**
 * @param {String} graphId graph id
 * @param {String} projectId project id
 * @returns {Object} action
 */
export function removeGraphViewer(graphId, projectId) {
  const state = store.getState();
  const viewers = getGraphViewers(state, graphId, projectId);
  return setGraphViewers(graphId, viewers - 1, projectId);
}

export function setFocusedGraph(graphId) {
  const state = store.getState();
  const projectId = getSelectedProjectId(state);
  return setMetadata(projectId, {
    focusedGraph: graphId
  });
}

/**
 * @param {String} graphId graph id
 * @param {Object} data 
 * @param {String} [projectId = <current project id>]
 * @returns {Object} action
 */
export function setGraphMetadata(graphId, data, projectId) {
  const state = store.getState();
  if (!projectId)
    projectId = getSelectedProjectId(state);
  return {
    type: SET_GRAPH_METADATA,
    payload: { projectId, graphId, data }
  };
}

/**
 * 
 * @param {String} graphId graph id
 * @param {Array} nodeIds node ids
 * @returns {Function} dispatch
 */
export function selectNodes(graphId, nodeIds) {
  return (dispatch, getState) => {
    const state = getState();
    const selectedNodes = getSelectedNodes(state, graphId);
    const combinedNodes = new Set([...selectedNodes, ...nodeIds]);
    dispatch(setGraphMetadata(graphId, {
      selectedNodes: [...combinedNodes]
    }));
    dispatch(nodeSelectHook());
  };
}

/**
 * @param {String} graphId graph id
 * @param {Array} nodeIds node ids
 * @returns {Function} dispatch
 */
export function unselectNodes(graphId, nodeIds) {
  return (dispatch, getState) => {
    const state = getState();
    const selectedNodes = getSelectedNodes(state, graphId);
    const combinedNodes = new Set(selectedNodes);
    nodeIds.forEach(nodeId => combinedNodes.delete(nodeId));
    dispatch(setGraphMetadata(graphId, {
      selectedNodes: [...combinedNodes]
    }));
    dispatch(nodeUnselectHook());
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
  };
}
export function setPositions(graphId, positions) {
  return setGraphMetadata(graphId, { positions });
}
