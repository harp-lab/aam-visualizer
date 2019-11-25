import { createSelector } from 'reselect';
import store from '../store';
import { CSTACK_STACK, FRAME_STACK } from 'store-consts';
import { getSelectedProjectId } from 'store-selectors';

export const getProjects = state => state.projects;
export const getProjectIds = createSelector(
  getProjects,
  projects => Object.keys(projects)
);
export function getProject(store, projectId) {
  if (!projectId) projectId = getSelectedProjectId(store);
  return getProjects(store)[projectId];
};
export function getProjectItems(store, projectId) {
  const { items } = getProject(store, projectId);
  return items;
}
export function getProjectServerStatus(store, projectId) {
  const { status } = getProject(store, projectId);
  return status;
}
export function getProjectMetadata(store, projectId) {
  return getProject(store, projectId).metadata;
}

/**
 * @param {Object} store 
 * @param {String} projectId 
 */
export function getProjectClientStatus(store, projectId) {
  const { code, items, error } = getProject(store, projectId);
  return {
    code: code !== '',
    items: Boolean(items),
    error: Boolean(error)
  };
}
export function getStackRefData(stackType) {
  const state = store.getState();
  const items = getProjectItems(state);
  switch (stackType) {
    case CSTACK_STACK: return items.cstacks;
    case FRAME_STACK: return items.frames;
  }
}
