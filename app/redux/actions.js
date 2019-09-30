import store from './store';
import { getSelectedProjectId } from './selectors/projects'

import {
  ADD_PROJECT, SET_PROJECT_DATA,
  SET_METADATA, SET_GRAPH_METADATA,
  SET_PANEL,

  QUEUE_SNACKBAR, DEQUEUE_SNACKBAR, SET_LOADING,
  SET_PROJECTS, SET_PROJECT, DEL_PROJECT, SEL_PROJECT,
  SHOW_ENV, SHOW_KONT
} from './actionTypes';



export const addProject = projectId => ({
  type: ADD_PROJECT,
  payload: { projectId }
});
export const setProjectData = (projectId, data) => ({
  type: SET_PROJECT_DATA,
  payload: { projectId, data }
});
export const delProject = projectId => ({
  type: DEL_PROJECT,
  payload: { projectId }
});
export const selProject = projectId => ({
  type: SEL_PROJECT,
  payload: { projectId }
});


export const setMetadata = (projectId, data) => ({
  type: SET_METADATA,
  payload: { projectId, data }
});
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
export function selectAsts(astIds) {
  const state = store.getState();
  const projectId = getSelectedProjectId(state);
  return setMetadata(projectId, {
    selectedAsts: astIds
  });
}
export function hoverAsts(astIds) {
  const state = store.getState();
  const projectId = getSelectedProjectId(state);
  return setMetadata(projectId, {
    hoveredAsts: astIds
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
export function hoverNodes(graphId, nodeIds) {
  return setGraphMetadata(graphId, {
    hoveredNodes: nodeIds
  });
}


export const hideConfig = (projectId, panelId) => ({
  type: SET_PANEL,
  payload: {
    projectId,
    type: 'config',
    panelId,
    hidden: true
  }
});
export const hideEnv = panelId => ({
  type: SET_PANEL,
  payload: {
    projectId,
    type: 'env',
    panelId,
    hidden: true
  }
});
export const hideKont = panelId => ({
  type: SET_PANEL,
  payload: {
    projectId,
    type: 'kont',
    panelId,
    hidden: true
  }
});
export const showConfig = panelId => ({
  type: SET_PANEL,
  payload: {
    projectId,
    type: 'config',
    panelId,
    hidden: false
  }
});
export const showEnv = panelId => ({
  type: SET_PANEL,
  payload: {
    projectId,
    type: 'env',
    panelId,
    hidden: false
  }
});
export const showKont = panelId => ({
  type: SET_PANEL,
  payload: {
    projectId,
    type: 'kont',
    panelId,
    hidden: false
  }
});



export const queueSnackbar = text => ({
  type: QUEUE_SNACKBAR,
  payload: { text }
});
/*export const dequeueSnackbar = () => ({
  type: DEQUEUE_SNACKBAR
});*/
export function dequeueSnackbar() {
  const { snackbars } = store;
  const text = snackbars.shift();
  dispatch({ type: actionTypes.DEQUEUE_SNACKBAR });
  return text;
}

// interface
export const showLoading = () => ({
  type: SET_LOADING,
  payload: { loading: true }
});
export const hideLoading = () => ({
  type: SET_LOADING,
  payload: { loading: false }
});

// projects
export const setProjects = projects => ({
  type: SET_PROJECTS,
  payload: { projects }
});
export const setProject = (id, project) => ({
  type: SET_PROJECT,
  payload: {
    id,
    project
  }
});
