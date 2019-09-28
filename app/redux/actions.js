import {
  QUEUE_SNACKBAR, DEQUEUE_SNACKBAR, SET_LOADING,
  SET_PROJECTS, SET_PROJECT, DEL_PROJECT, SEL_PROJECT,
  SHOW_ENV, SHOW_KONT
} from './actionTypes';

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

// projects
export const setProjects = projects => ({
  type: SET_PROJECTS,
  payload: { projects }
});
export const setProject = (id, project) => ({
  type: SET_PROJECT,
  payload: {
    id,
    project
  }
});
export const delProject = id => ({
  type: DEL_PROJECT,
  payload: { id }
});
export const selProject = id => ({
  type: SEL_PROJECT,
  payload: { id }
});

// panels
export const showEnv = id => ({
  type: SHOW_ENV,
  payload: { id }
});
export const showKont = id => ({
  type: SHOW_ENV,
  payload: { id }
});
