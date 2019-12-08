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

/**
 * @param {Object} state
 * @param {String} [projectId] project id
 * @returns {Object} project metadata
 */
export const getProjectMetadata = createSelector(
  getProject,
  project => project.metadata
);

/**
 * @param {Object} state
 * @param {String} [projectId] project id
 * @returns {String} client status
 */
export const getProjectClientStatus = createSelector(
  getProjectMetadata,
  metadata => metadata.status.client
);

export function getStackRefData(stackType) {
  const state = store.getState();
  const items = getProjectItems(state);
  switch (stackType) {
    case CSTACK_STACK: return items.cstacks;
    case FRAME_STACK: return items.frames;
  }
}
