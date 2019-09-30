export function getProjectsState(store) {
  return store.projects;
};
export function getProjects(store) {
  return getProjectsState(store).projects;
};
export function getSelectedProjectId(store) {
  return getProjectsState(store).data.selectedProjectId;
};
export function getProject(store) {
  const projectId = getSelectedProjectId(store);
  return getProjects(store)[projectId];
};
export function getProjectItems(store) {
  const { items } = getProject(store).data;
  return items;
}
export function getProjectData(store) {
  return getProject(store).data;
}
export function getProjectMetadata(store) {
  return getProject(store).metadata;
}
