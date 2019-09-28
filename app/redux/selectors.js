export function getProjectsState(store) {
  return store.projects;
};
export function getProjects(store) {
  console.log('store', store);
  return getProjectsState(store) ? getProjectsState(store).projects : {};
}
export function getNotificationsState(store) {
  return store.notifications;
};