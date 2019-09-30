export function getNotificationsState(store) {
  return store.notifications;
};
export function getSnackbar(store) {
  const { snackbars } = getNotificationsState(store);
  return snackbars[0];
}
