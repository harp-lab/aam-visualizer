export function getNotificationsState(store) {
  return store.notifications;
};
export function getSnackbar(store) {
  const { snackbars } = getNotificationsState(store);
  return snackbars[0];
}
function getDialog(store, dialogId) {
  const { dialogs } = getNotificationsState(store);
  return dialogs[dialogId];
}
export function getRenameDialog(store) {
  return getDialog(store, 'rename');
}
