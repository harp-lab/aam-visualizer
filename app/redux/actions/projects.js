import {
  ADD_PROJECT, SET_PROJECT_DATA, DEL_PROJECT, SEL_PROJECT,
  SET_METADATA
} from '../actionTypes';

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
