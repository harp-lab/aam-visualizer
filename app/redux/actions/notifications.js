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

export const showLoading = () => ({
  type: SET_LOADING,
  payload: { loading: true }
});
export const hideLoading = () => ({
  type: SET_LOADING,
  payload: { loading: false }
});
export const setRenameDialog = projectId => ({
  type: SET_DIALOG,
  payload: {
    dialogId: 'rename',
    data: projectId
  }
});
