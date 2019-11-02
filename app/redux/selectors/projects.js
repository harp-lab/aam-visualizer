import store from '../store';
import { CSTACK_STACK, FRAME_STACK } from 'store-consts';
import { getSelectedProjectId } from 'store-selectors';

export function getProjects(store) {
  return store.projects;
};
export function getProjectIds(store) {
  return Object.keys(getProjects(store));
}
export function getProject(store, projectId) {
  if (!projectId)
    projectId = getSelectedProjectId(store);
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
