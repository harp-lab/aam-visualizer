import {
  QUEUE_SNACKBAR, SET_LOADING,
} from '../actionTypes';

export const queueSnackbar = text => ({
  type: QUEUE_SNACKBAR,
  payload: { text }
});
/*export const dequeueSnackbar = () => ({
  type: DEQUEUE_SNACKBAR
});*/
export function dequeueSnackbar() {
  const { snackbars } = store;
  const text = snackbars.shift();
  dispatch({ type: actionTypes.DEQUEUE_SNACKBAR });
}

export const showLoading = () => ({
  type: SET_LOADING,
  payload: { loading: true }
});
export const hideLoading = () => ({
  type: SET_LOADING,
  payload: { loading: false }
});
