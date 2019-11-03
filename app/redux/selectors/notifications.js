import { createSelector } from 'reselect';

export const getNotificationsState = state => state.notifications;
export const getSnackbar = createSelector(
  getNotificationsState,
  notifications => notifications.snackbars[0]
);

const getDialogFactory = dialogId => createSelector(
  getNotificationsState,
  notifications => notifications.dialogs[dialogId]
);
export const getRenameDialog = getDialogFactory('rename');
