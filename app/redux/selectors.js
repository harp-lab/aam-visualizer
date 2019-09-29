export function getProjectsState(store) {
  return store.projects;
};
export function getProjects(store) {
  return getProjectsState(store).projects;
}
export function getSelectedProjectId(store) {
  return getProjectsState(store).data.selectedProjectId;
}
export function getProject(store) {
  const projectId = getSelectedProjectId(store);
  return getProjects(store)[projectId];
}

export function getNotificationsState(store) {
  return store.notifications;
};

export function getGraphsMetadata(store) {
  const { projects, selectedProjectId } = getProjectsState(store);
  const { metadata } = projects[selectedProjectId];
  return metadata.graphs;
}