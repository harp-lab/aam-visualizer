import store from '../store';
import { setMetadata } from './projects';
import { getSelectedProjectId } from '../selectors/projects';
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
  return setGraphMetadata(graphId, {
    selectedNodes: nodeIds
  });
}
export function hoverNodes(graphId, nodeIds) {
  return setGraphMetadata(graphId, {
    hoveredNodes: nodeIds
  });
}