import { createSelector } from 'reselect';

export const getNotificationsState = state => state.notifications;
export const getSnackbar = createSelector(
  getNotificationsState,
  notifications => notifications.snackbars[0]
);

/**
 * @param {String} dialogId dialog type id
 * @returns {Function} memoized state selector
 */
const getDialogFactory = dialogId => createSelector(
  getNotificationsState,
  notifications => notifications.dialogs[dialogId]
);

/**
 * @param {Object} state
 * @returns {String} project id
 */
export const getRenameDialog = getDialogFactory('rename');

/**
 * @param {Object} state
 * @returns {String} project id
 */
export const getDeleteDialog = getDialogFactory('delete');
