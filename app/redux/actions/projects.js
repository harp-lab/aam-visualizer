import store from '../store';
import { setTitle, queueSnackbar } from 'store-actions';
import { importData } from 'store-apis';
import { getProject } from 'store-selectors';
import {
  ADD_PROJECT, SET_PROJECT_DATA, DEL_PROJECT, DEL_PROJECTS, SEL_PROJECT,
  SET_METADATA, SET_STATUS
} from '../actionTypes';

export const addProject = projectId => ({
  type: ADD_PROJECT,
  payload: { projectId }
});
export const setProjectData = (projectId, data) => ({
  type: SET_PROJECT_DATA,
  payload: { projectId, data }
});
export const delProject = projectId => ({
  type: DEL_PROJECT,
  payload: { projectId }
});
export const delProjects = () => ({
  type: DEL_PROJECTS
});
export function selProject(projectId) {
  return dispatch => {
    if (projectId) {
      const state = store.getState();
      const { name } = getProject(state, projectId);
      dispatch(setTitle(name || projectId));
    }
    dispatch({
      type: SEL_PROJECT,
      payload: { projectId }
    });
  }
};

export function importFiles(files) {
  return dispatch => {
    const file = files[0];
    dispatch(importFile(file));
  };
};
export function importFile(file) {
  return dispatch => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const json = JSON.parse(fr.result);
        const re = /(?:(.*)(?=\.))?\.?(.*)/;
        const filename = file.name;
        const reGroups = filename.match(re);
        if (reGroups) {
          const [_, name, ext] = reGroups;
          let projectId;
          if (name) projectId = name;
          else projectId = ext;
          dispatch(importData(projectId, json));
        }
      } catch(err) {
        const { name, message } = err;
        switch (err.constructor) {
          case SyntaxError:
            dispatch(queueSnackbar(`Import failed: ${file.name} is not valid JSON`));
            break;
          default:
            dispatch(queueSnackbar(`${name}: ${message}`));
            break;
        }
      }
    };
    fr.readAsText(file);
  };
}

export const setMetadata = (projectId, data) => ({
  type: SET_METADATA,
  payload: { projectId, data }
});
export const setStatus = (projectId, data) => ({
  type: SET_STATUS,
  payload: { projectId, data }
});
/**
 * Set client status of project
 * @param {String} projectId project id
 * @param {String} status client status
 * @returns {Function} dispatch
 */
export function setClientStatus(projectId, status) {
  return dispatch => {
    dispatch(setStatus(projectId, { client: status }));
  };
}
export function selectAsts(astIds) {
  const state = store.getState();
  const projectId = getSelectedProjectId(state);
  return setMetadata(projectId, {
    selectedAsts: astIds
  });
}
export function hoverAsts(astIds) {
  const state = store.getState();
  const projectId = getSelectedProjectId(state);
  return setMetadata(projectId, {
    hoveredAsts: astIds
  });
}
