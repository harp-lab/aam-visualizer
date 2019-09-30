import store from './store';
import {
  SET_PANEL,
  QUEUE_SNACKBAR, SET_LOADING,
} from './actionTypes';


export const hideConfig = (projectId, panelId) => ({
  type: SET_PANEL,
  payload: {
    projectId,
    type: 'config',
    panelId,
    hidden: true
  }
});
export const hideEnv = panelId => ({
  type: SET_PANEL,
  payload: {
    projectId,
    type: 'env',
    panelId,
    hidden: true
  }
});
export const hideKont = panelId => ({
  type: SET_PANEL,
  payload: {
    projectId,
    type: 'kont',
    panelId,
    hidden: true
  }
});
export const showConfig = panelId => ({
  type: SET_PANEL,
  payload: {
    projectId,
    type: 'config',
    panelId,
    hidden: false
  }
});
export const showEnv = panelId => ({
  type: SET_PANEL,
  payload: {
    projectId,
    type: 'env',
    panelId,
    hidden: false
  }
});
export const showKont = panelId => ({
  type: SET_PANEL,
  payload: {
    projectId,
    type: 'kont',
    panelId,
    hidden: false
  }
});



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
  return text;
}

// interface
export const showLoading = () => ({
  type: SET_LOADING,
  payload: { loading: true }
});
export const hideLoading = () => ({
  type: SET_LOADING,
  payload: { loading: false }
});

