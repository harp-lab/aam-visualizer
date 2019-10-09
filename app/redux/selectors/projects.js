export function getProjectsState(store) {
  return store.projects;
};
export function getProjects(store) {
  return getProjectsState(store).projects;
};
export function getSelectedProjectId(store) {
  return getProjectsState(store).data.selectedProjectId;
};
export function getProject(store, projectId) {
  if (!projectId)
    projectId = getSelectedProjectId(store);
  return getProjects(store)[projectId];
};
export function getProjectItems(store, projectId) {
  const { items } = getProject(store, projectId).data;
  return items;
}
export function getProjectData(store, projectId) {
  return getProject(store, projectId).data;
}
export function getProjectMetadata(store) {
  return getProject(store).metadata;
}
