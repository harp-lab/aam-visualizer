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
  //const { status } = getProjectMetadata(store, projectId);
  //return status;
  const { code, items } = getProject(store, projectId);
  return {
    code: code !== '',
    items: Boolean(items)
  };
}
