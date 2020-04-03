import store from 'store';
import {
  setProjectData, addProject, deleteProjectLocal, selProject, setClientStatus,
  generateMetadata,
  queueSnackbar,
  consoleError
} from 'store/actions';
import {
  EMPTY_STATUS, EDIT_STATUS, PROCESS_STATUS, COMPLETE_STATUS, ERROR_STATUS,
  CLIENT_DOWNLOADED_STATUS, CLIENT_LOCAL_STATUS, CLIENT_WAITING_STATUS
} from 'store/consts';
import { getUser, getProject, getProjectServerStatus, getProjectClientStatus } from 'store/selectors';

import { dataProcessHook } from 'extensions/store/hooks';

/**
 * @param {String} url user req url
 * @param {String} method req method
 */
function apiReq(url, method) {
  const state = store.getState();
  const userId = getUser(state);
  return fetch(`/api/${userId}/${url}`, { method });
}

/**
 * @param {String} url user post url
 * @param {Object} obj data to post
 */
function apiPost(url, obj) {
  const state = store.getState();
  const userId = getUser(state);
  return fetch(`/api/${userId}/${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  });
}

/**
 * @param {String} projectId project id
 * @param {Object} data save data
 * @param {Function} callback 
 */
function saveReq(projectId, data, callback) {
  return async function(dispatch) {
    const res = await apiPost(`projects/${projectId}/save`, data);
    switch (res.status) {
      case 202:
        await callback();
        break;
      default:
        dispatch(queueSnackbar(`Project ${projectId} save request failed`));
        break;
    }
  };
}

/**
 * @param {String} projectId project id
 * @param {Object} data clear data
 * @param {Function} callback 
 */
function clearReq(projectId, data, callback) {
  return async function(dispatch) {
    const res = await apiPost(`projects/${projectId}/clear`, data);
    switch (res.status) {
      case 200:
        await callback();
        break;
      default:
        dispatch(queueSnackbar(`Project ${projectId} clear request failed`));
        break;
    }
  }
}

/**
 * Call either local callback and/or server callback depending on project client status
 * @param {String} projectId project id
 * @param {Function} localCallback local callback
 * @param {Function} serverCallback server callback
 */
async function projectRequest(projectId, localCallback, serverCallback) {
  const state = store.getState();
  const clientStatus = getProjectClientStatus(state, projectId);
  let result;
  switch (clientStatus) {
    case CLIENT_LOCAL_STATUS:
      result = await localCallback();
      break;
    default:
      result = await serverCallback(localCallback);
      break;
  }
  return result;
}

/**
 * @param {String} caller caller function
 * @param {String} projectId project id
 */
function localProjectError(caller, projectId) {
  return function(dispatch) {
    dispatch(consoleError(`server api ${caller}: local project ${projectId}`));
  }
}

/**
 * @returns {Function} async dispatch
 */
export function getList() {
  return async function(dispatch) {
    // TODO implement local vs server pattern
    const res = await apiReq('all', 'GET');
    let refresh = false;
    switch (res.status) {
      case 200:
        const data = await res.json();
        for (const [projectId, projectData] of Object.entries(data)) {
          const { status, name, analysis } = projectData;
          dispatch(setProjectData(projectId, { status, name, analysis }));
          if (status === PROCESS_STATUS)
            refresh = true;
        }
        break;
      default:
        refresh = true;
        break;
    }
    return refresh;
  };
}

/**
 * @returns {Function} async dispatch
 */
export function createProject() {
  /**
   * @param {Function} dispatch
   * @returns {String} projectId
   */
  return async function(dispatch) {
    // TODO implement local vs server pattern
    const res = await apiReq('create', 'POST');
    let projectId;
    switch (res.status) {
      case 200:
        const data = await res.json();
        projectId = data.id;
        dispatch(addProject(projectId));
        dispatch(selProject(undefined));
        break;
      default:
        dispatch(queueSnackbar(`Project create request failed`));
        break;
    }
    return projectId;
  };
}

/**
 * @param {String} projectId project id
 * @returns {Function} async dispatch
 */
export function deleteProject(projectId) {
  return async function(dispatch) {
    async function localCallback() {
      dispatch(deleteProjectLocal(projectId));
    }
    async function serverCallback(localCallback) {
      const res = await apiReq(`projects/${projectId}/delete`, 'POST');
      switch (res.status) {
        case 205:
          await localCallback();
          break;
        default:
          dispatch(queueSnackbar(`Project ${projectId} delete request failed`));
          break;
      }
    };
    await projectRequest(projectId, localCallback, serverCallback);
  };
}

/**
 * @param {String} projectId project id
 * @returns {Function} async dispatch
 */
export function forkProject(projectId) {
  return async function(dispatch) {
    async function localCallback() {
      const state = store.getState();
      const { analysisInput, analysis } = getProject(state, projectId);
      const forkProjectId = await dispatch(createProject());
      const forkData = { analysisInput, analysis };
      dispatch(setProjectData(forkProjectId, forkData));
      dispatch(selProject(forkProjectId));
    };
    async function serverCallback(localCallback) {
      const state = store.getState();
      const serverStatus = getProjectServerStatus(state, projectId);
      switch (serverStatus) {
        case EMPTY_STATUS:
          break;
        default:
          await dispatch(getAnalysisInput(projectId));
          break;
      }
      await localCallback();
    };
    await projectRequest(projectId, localCallback, serverCallback);
  };
}

/**
 * @param {String} projectId project id
 * @returns {Function} async dispatch
 */
export function downloadProject(projectId) {
  /**
   * @param {Function} dispatch
   * @returns {Boolean} refresh status
   */
  return async function(dispatch) {
    async function localCallback() {}
    async function serverCallback(localCallback) {
      const state = store.getState();
      const clientStatus = getProjectClientStatus(state, projectId);
      let refresh = false;
      switch (clientStatus) {
        case CLIENT_DOWNLOADED_STATUS:
          break;
        default:
          refresh = await downloadCallback();
          break;
      }
      return refresh;
    };
    async function downloadCallback() {
      const state = store.getState();
      const serverStatus = getProjectServerStatus(state, projectId);
      let refresh = false;
      switch (serverStatus) {
        case EMPTY_STATUS:
          break;
        case EDIT_STATUS:
          dispatch(getAnalysisInput(projectId));
          break;
        case PROCESS_STATUS:{
          await dispatch(getData(projectId));
          const state = store.getState();
          const serverStatus = getProjectServerStatus(state, projectId);
          refresh = serverStatus === PROCESS_STATUS;
          break;}
        case COMPLETE_STATUS:
          await dispatch(getData(projectId));
          dispatch(generateMetadata(projectId));
          break;
        case ERROR_STATUS:
          await dispatch(getData(projectId));
          break;
        default:
          dispatch(consoleError(`server api downloadProject() request: unhandled ${projectId} '${serverStatus}' status`));
          break;
      }
      return refresh;
    }
    return await projectRequest(projectId, localCallback, serverCallback);
  };
}

/**
 * @param {String} projectId project id
 * @param {String} name project name
 * @returns {Function} async dispatch
 */
export function renameProject(projectId, name) {
  return async function(dispatch) {
    async function localCallback() {
      dispatch(setProjectData(projectId, { name }));
    }
    async function serverCallback(localCallback) {
      await dispatch(saveReq(projectId, { name }, localCallback));
    }
    await projectRequest(projectId, localCallback, serverCallback);
  };
}

/**
 * @param {String} projectId project id
 * @returns {Function} async dispatch
 */
export function getAnalysisInput(projectId) {
  return async function(dispatch) {
    async function localCallback() {
      dispatch(localProjectError('getAnalysisInput()', projectId));
    }
    async function serverCallback(localCallback) {
      const res = await apiReq(`projects/${projectId}/code`, 'GET');
      const { analysisInput } = await res.json();
      const data = { analysisInput };
      dispatch(setProjectData(projectId, data));
      dispatch(setClientStatus(projectId, CLIENT_DOWNLOADED_STATUS));
    }
    await projectRequest(projectId, localCallback, serverCallback);
  };
}

/**
 * @param {String} projectId project id
 * @param {String} [analysisInput] project analysis input
 * @returns {Function} async dispatch
 */
export function saveAnalysisInput(projectId, analysisInput) {
  return async function(dispatch) {
    async function localCallback() {
      const state = store.getState();
      const { status: serverStatus } = getProject(state, projectId);
      switch (serverStatus) {
        case EMPTY_STATUS:
        case EDIT_STATUS: {
          let status = EDIT_STATUS;
          if (!analysisInput)
            status = EMPTY_STATUS;

          dispatch(setProjectData(projectId, { status, analysisInput }));
          break;
        }
        default:
          dispatch(consoleError(`server api saveAnalysisInput() request: '${serverStatus}' status project ${projectId}`));
          break;
      }
    };
    async function serverCallback(localCallback) {
      if (analysisInput)
        await dispatch(saveReq(projectId, { analysisInput }, localCallback));
      else
        await dispatch(clearReq(projectId, { analysisInput: true }, localCallback));
    };
    await projectRequest(projectId, localCallback, serverCallback);
  }
}

/**
 * @param {String} projectId project id
 * @param {String} analysisInput project analysis input
 * @param {Object} options analysis options
 * @returns {Function} async dispatch
 */
export function processAnalysisInput(projectId, analysisInput, options) {
  return async function(dispatch) {
    async function localCallback() {
      dispatch(localProjectError('processAnalysisInput()', projectId));
    }
    async function serverCallback(localCallback) {
      await dispatch(saveAnalysisInput(projectId, analysisInput));
      const res = await apiPost(`projects/${projectId}/process`, options);
      switch (res.status) {
        case 200:
          dispatch(setProjectData(projectId, { status: 'process' }));
          dispatch(setClientStatus(projectId, CLIENT_WAITING_STATUS));
          break;
        case 412:
          dispatch(queueSnackbar('Project process request rejected'));
          break;
      }
    }
    await projectRequest(projectId, localCallback, serverCallback);
  }
}

/**
 * @param {String} projectId project id
 * @returns {Function} async dispatch
 */
export function cancelProcess(projectId) {
  return async function(dispatch) {
    async function localCallback() {
      dispatch(localProjectError('cancelProcess()', projectId));
    }
    async function serverCallback(localCallback) {
      const res = await apiReq(`projects/${projectId}/cancel`, 'POST');
      switch (res.status) {
        case 200:
          dispatch(setProjectData(projectId, { status: EDIT_STATUS }));
          dispatch(setClientStatus(projectId, CLIENT_DOWNLOADED_STATUS));
          break;
        case 409:
          const msg = `Project ${projectId} cancel request denied - already finished`;
          dispatch(queueSnackbar(msg));
          break;
      }
    }
    await projectRequest(projectId, localCallback, serverCallback);
  };
}

/**
 * Get project data
 * @param {String} projectId project id
 * @returns {Function} async dispatch
 */
export function getData(projectId) {
  return async function(dispatch) {
    async function localCallback() {
      dispatch(localProjectError('getData()', projectId));
    }
    async function serverCallback(localCallback) {
      const res = await apiReq(`projects/${projectId}/data`, 'GET');
      switch (res.status) {
        case 200:
          const data = await res.json();
          const processedData = { ...data, ...dataProcessHook(data) };
          dispatch(setProjectData(projectId, processedData));
          dispatch(setClientStatus(projectId, CLIENT_DOWNLOADED_STATUS));
          break;
        case 204:
          break;
        case 412:
          dispatch(queueSnackbar('Project data request rejected'));
          break;
      }
    }
    await projectRequest(projectId, localCallback, serverCallback);
  };
}
