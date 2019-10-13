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
export function getProjectStatus(store, projectId) {
  return getProject(store, projectId).status;
}
export function getProjectMetadata(store) {
  return getProject(store).metadata;
}
