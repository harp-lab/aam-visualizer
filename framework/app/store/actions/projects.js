import store from 'store';
import { setTitle, queueSnackbar } from 'store/actions';
import { process, downloadProject } from 'store/apis';
import { PROCESS_STATUS, COMPLETE_STATUS, CLIENT_LOCAL_STATUS } from 'store/consts';
import { getProject, getProjectServerStatus } from 'store/selectors';
import {
  ADD_PROJECT, SET_PROJECT_DATA, DEL_PROJECT, DEL_PROJECTS, SEL_PROJECT,
  SET_METADATA, SET_STATUS
} from 'store/actionTypes';

import { generateMetadataHook } from 'extensions/store/hooks';

export const addProject = projectId => ({
  type: ADD_PROJECT,
  payload: { projectId }
});
export const setProjectData = (projectId, data) => ({
  type: SET_PROJECT_DATA,
  payload: { projectId, data }
});

/**
 * Delete project
 * @param {String} projectId project id
 * @returns {Object} action
 */
export const deleteProjectLocal = projectId => ({
  type: DEL_PROJECT,
  payload: { projectId }
});

export const delProjects = () => ({
  type: DEL_PROJECTS
});

/**
 * @param {String} projectId project id
 * @returns {Object} dispatch
 */
export function selProject(projectId) {
  return dispatch => {
    if (projectId) {
      const state = store.getState();
      const { name } = getProject(state, projectId);
      dispatch(setTitle(name || projectId));
    } else {
      dispatch(setTitle(undefined));
    }
    
    dispatch({
      type: SEL_PROJECT,
      payload: { projectId }
    });
  }
};

/**
 * Import project data files
 * @param {Array} files 
 * @returns {Function} dispatch
 */
export function importFiles(files) {
  return dispatch => {
    if (files.length === 0)
      dispatch(queueSnackbar('No files dropped'));
    for (const file of files) {
      dispatch(importFile(file));
    }
  };
};

/**
 * Import project data file
 * @param {File} file 
 * @returns {Function} dispatch
 */
export function importFile(file) {
  return dispatch => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        // parse project id from filename
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

/**
 * Import project data into application
 * @param {String} projectId project id
 * @param {Object} data project data
 * @returns {Function} dispatch
 */
export function importData(projectId, data) {
  return dispatch => {
    dispatch(addProject(projectId));
    //process(data) // TODO separate out secondary processing
    dispatch(setProjectData(projectId, data));
    dispatch(setStatus(projectId, COMPLETE_STATUS));
    dispatch(setClientStatus(projectId, CLIENT_LOCAL_STATUS));
    dispatch(generateMetadata(projectId));
  };
}

/**
 * @param {String} projectId project id
 * @returns {Function} async dispatch
 */
export function exportData(projectId) {
  return async function(dispatch) {
    await dispatch(downloadProject(projectId));
    const state = store.getState();
    const serverStatus = getProjectServerStatus(state, projectId);
    switch (serverStatus) {
      case PROCESS_STATUS:
        dispatch(queueSnackbar('Project still processing'));
        break;
      default: {
        // create blob
        const state = store.getState();
        const data = getProject(state, projectId);
        const filteredData = {};
        for (const [key, value] of Object.entries(data)) {
          if (['analysis', 'status', 'analysisInput', 'analysisOutput', 'processed'].includes(key))
            filteredData[key] = value;
        }
        const json = JSON.stringify(filteredData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });

        // create elem
        const href = URL.createObjectURL(blob);
        const file = `aam-vis-${projectId}.json`;
        const elem = document.createElement('a');
        Object.assign(elem, {
          href,
          download: file
        });
        document.body.appendChild(elem);
        elem.click();

        // cleanup
        elem.remove();
        URL.revokeObjectURL(href);
        break;
      }
    }
  };
}

/**
 * @param {String} projectId project id
 * @returns {Function} dispatch
 */
export function generateMetadata(projectId) {
  return function(dispatch) {
    dispatch(generateMetadataHook(projectId));
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
