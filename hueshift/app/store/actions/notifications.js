import store from 'store';
import {
  QUEUE_SNACKBAR, DEQUEUE_SNACKBAR,
  SET_LOADING,
  SET_DIALOG
} from 'store/actionTypes';
import { isDevEnv } from 'store/selectors';

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
export function consoleLog(message) {
  return function(dispatch) {
    console.log(`${message}`)
  };
}

/**
 * @param {String} message 
 * @returns {Function} dispatch
 */
export function consoleInfo(message) {
  return function(dispatch) {
    const state = store.getState();
    const devEnv = isDevEnv(state);
    if (devEnv)
      console.info(`${message}`)
  };
}

/**
 * @param {String} message 
 * @returns {Function} dispatch
 */
export function consoleWarn(message) {
  return function(dispatch) {
    const state = store.getState();
    const devEnv = isDevEnv(state);
    if (devEnv)
      console.warn(`${message}`)
  };
}

/**
 * @param {String} message 
 * @returns {Function} dispatch
 */
export function consoleError(message) {
  return function(dispatch) {
    console.error(`${message}`)
  };
}

/**
 * @param {String} functionName function name
 * @returns {Function} dispatch
 */
export function warnDeprecate(functionName) {
  return function(dispatch) {
    dispatch(consoleWarn(`${functionName}() deprecated`));
  }
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
 * @param {String} dialogId dialog type id
 * @returns {Function} dialog set action generator
 */
function setDialogFactory(dialogId) {
  /**
   * @param {String} projectId project id
   * @returns {Object} action
   */
  return function(projectId) {
    return {
      type: SET_DIALOG,
      payload: {
        dialogId,
        data: projectId
      }
    };
  };
}

/**
 * @param {String} projectId project id
 * @returns {Object} action
 */
export const setRenameDialog = setDialogFactory('rename');

/**
 * @param {String} projectId project id
 * @returns {Object} action
 */
export const setDeleteDialog = setDialogFactory('delete');
