import store from '../store';
import {
  setProjectData, addProject, deleteProjectLocal, selProject, setClientStatus,
  generatePanels,
  queueSnackbar
} from 'store-actions';
import { process } from 'store-apis';
import { EMPTY_STATUS, EDIT_STATUS, PROCESS_STATUS, COMPLETE_STATUS, ERROR_STATUS, CLIENT_WAITING_STATUS, CLIENT_DOWNLOADED_STATUS, CLIENT_LOCAL_STATUS } from 'store-consts';
import { getUser, getSelectedProjectId, getProject, getProjectServerStatus, getProjectClientStatus } from 'store-selectors';

function apiReq(url, method) {
  const state = store.getState();
  const userId = getUser(state);
  return fetch(`/api/${userId}/${url}`, { method });
}
function apiPost(url, obj) {
  const state = store.getState();
  const userId = getUser(state);
  return fetch(`/api/${userId}/${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  });
}

export function getList() {
  return async function(dispatch) {
    const res = await apiReq('all', 'GET');
    let refresh = false;
    switch (res.status) {
      case 200: {
        const data = await res.json();
        for (const [projectId, projectData] of Object.entries(data)) {
          const { status, name, analysis } = projectData;
          dispatch(setProjectData(projectId, { status, name, analysis }));
          if (status === PROCESS_STATUS)
            refresh = true;
        }
        break;
      }
      default:
        refresh = true;
        break;
    }
    return refresh;
  };
}

export function createProject() {
  return async function(dispatch) {
    const res = await apiReq('create', 'GET');
    const data = await res.json();
    const projectId = data.id;
    dispatch(addProject(projectId));
    dispatch(selProject(undefined));
    return projectId;
  };
}

export function deleteProject(projectId) {
  return async function(dispatch) {
    const state = store.getState();
    const selectedProjectId = getSelectedProjectId(state);
    const res = await apiReq(`projects/${projectId}/delete`, 'POST');
    switch (res.status) {
      case 205:
        dispatch(deleteProjectLocal(projectId));
        if (selectedProjectId == projectId)
          dispatch(selProject(undefined));
        break;
      default:
        dispatch(queueSnackbar(`Project ${projectId} delete request failed`));
        break;
    }
  };
}

/**
 * @param {String} projectId project id
 * @returns {Function} async dispatch
 */
export function forkProject(projectId) {
  return async function(dispatch) {
    let state = store.getState();
    let { status: serverStatus, ...project } = getProject(state, projectId);
    const clientStatus = getProjectClientStatus(state, projectId);
    switch (clientStatus) {
      case CLIENT_WAITING_STATUS:
        switch (serverStatus) {
          case EMPTY_STATUS:
            break;
          default:
            await dispatch(getCode(projectId));
            state = store.getState();
            project = getProject(state, projectId);
            break;
        }
        break;
      default:
        break;
    }
    
    const forkProjectId = await dispatch(createProject());
    const { code, analysis } = project;
    const forkData = { code, analysis };
    dispatch(setProjectData(forkProjectId, forkData));
    dispatch(selProject(forkProjectId));
  };
}

/**
 * @param {String} projectId project id
 * @returns {Function} async dispatch
 */
export function downloadProject(projectId) {
  return async function(dispatch) {
    const state = store.getState();
    const serverStatus = getProjectServerStatus(state, projectId);
    const clientStatus = getProjectClientStatus(state, projectId);
    let refresh = false;
    switch (clientStatus) {
      case CLIENT_DOWNLOADED_STATUS:
      case CLIENT_LOCAL_STATUS:
        break;
      case CLIENT_WAITING_STATUS:
      default:
        switch (serverStatus) {
          case EDIT_STATUS:
            dispatch(getCode(projectId));
            break;
          case PROCESS_STATUS: {
            await dispatch(getData(projectId));
            const state = store.getState();
            const serverStatus = getProjectServerStatus(state, projectId);
            refresh = serverStatus === PROCESS_STATUS;
            break;
          }
          case COMPLETE_STATUS:
            await dispatch(getData(projectId));
            dispatch(generatePanels(projectId));
            break;
          case ERROR_STATUS:
            await dispatch(getData(projectId));
            break;
        }
        break;
    }

    return refresh;
  };
}

/**
 * @param {String} projectId project id
 * @param {String} name project name
 */
export function rename(projectId, name) {
  return async function(dispatch) {
    const state = store.getState();
    const clientStatus = getProjectClientStatus(state, projectId);
    switch (clientStatus) {
      case CLIENT_LOCAL_STATUS:
        break;
      default:
        apiPost(`projects/${projectId}/save`, { name });
        break;
    }

    dispatch(setProjectData(projectId, { name }));
  };
}
export function getCode(projectId) {
  return async function(dispatch) {
    const res = await apiReq(`projects/${projectId}/code`, 'GET');
    const { code } = await res.json();
    const data = { code };
    dispatch(setProjectData(projectId, data));
  };
}
export function saveCode(projectId, code) {
  return dispatch => {
    const state = store.getState();
    const { status } = getProject(state, projectId);
  
    switch (status) {
      case EMPTY_STATUS:
      case EDIT_STATUS: {
        let status = EDIT_STATUS;
        if (code === '') status = EMPTY_STATUS;
        
        dispatch(setProjectData(projectId, { status, code }));
        return apiPost(`projects/${projectId}/save`, { code });
      }
    }
  }
}
export function processCode(projectId, code, options) {
  return async function(dispatch) {
    await dispatch(saveCode(projectId, code));
    const res = await apiPost(`projects/${projectId}/process`, options);
    switch (res.status) {
      case 200: {
        dispatch(setProjectData(projectId, { status: 'process' }));
        break;
      }
      case 412: {
        dispatch(queueSnackbar('Project process request rejected'));
        break;
      }
    }
  }
}
export function cancelProcess(projectId) {
  return async function(dispatch) {
    const res = await apiReq(`projects/${projectId}/cancel`, 'POST');
    switch (res.status) {
      case 200: {
        dispatch(setProjectData(projectId, { status: EDIT_STATUS }));
        break;
      }
      case 409: {
        const msg = `Project ${projectId} cancel request denied - already finished`;
        dispatch(queueSnackbar(msg));
        break;
      }
      default: {
        const msg = `Project ${projectId} cancel request failed`;
        dispatch(queueSnackbar(msg));
        break;
      }
    }
  };
}

/**
 * Get project data
 * @param {String} projectId project id
 */
export function getData(projectId) {
  return async function(dispatch) {
    const res = await apiReq(`projects/${projectId}/data`, 'GET');
    switch (res.status) {
      case 200: {
        const data = await res.json();
        process(data) // TODO separate out secondary processing
        dispatch(setProjectData(projectId, data));
        dispatch(setClientStatus(projectId, CLIENT_DOWNLOADED_STATUS))
        break;
      }
      case 204: break;
      case 412: {
        dispatch(queueSnackbar('Project data request rejected'));
        break;
      }
    }
  };
}



export function exportData(projectId) {
  return async function(dispatch) {
    await dispatch(downloadProject(projectId));
    const state = store.getState();
    const serverStatus = getProjectServerStatus(state, projectId);
    switch (serverStatus) {
      case PROCESS_STATUS: {
        dispatch(queueSnackbar('Project still processing'));
        break;
      }
      default: {
        // create blob
        const state = store.getState();
        const data = getProject(state, projectId);
        const filteredData = {};
        for (const [key, value] of Object.entries(data)) {
          if (['analysis', 'status', 'code', 'items', 'processed'].includes(key))
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
