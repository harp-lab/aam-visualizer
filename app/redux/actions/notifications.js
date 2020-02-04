import {
  QUEUE_SNACKBAR, DEQUEUE_SNACKBAR,
  SET_LOADING,
  SET_DIALOG
} from '../actionTypes';

export const queueSnackbar = text => ({
  type: QUEUE_SNACKBAR,
  payload: { text }
});
export const dequeueSnackbar = () => ({
  type: DEQUEUE_SNACKBAR
});

/**
 * @param {String} message 
 * @returns {Function} dispatch
 */
export function consoleError(message) {
  return dispatch => console.error(`[error] ${message}`);
}

export const showLoading = () => ({
  type: SET_LOADING,
  payload: { loading: true }
});
export const hideLoading = () => ({
  type: SET_LOADING,
  payload: { loading: false }
});

/**
 * @param {String} projectId project id
 * @returns {Object} action
 */
export function setRenameDialog(projectId) {
  return {
    type: SET_DIALOG,
    payload: {
      dialogId: 'rename',
      data: projectId
    }
  }
};
