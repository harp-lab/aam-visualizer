import store from '../store';
import {
  setView,
  setProjectData, addProject, delProject, selProject,
  generatePanels,
  queueSnackbar
} from 'store-actions';
import { getUser, getSelectedProjectId, getProjectData } from 'store-selectors';
import {
  LIST_VIEW, PROJECT_VIEW,
  EDIT_STATUS, PROCESS_STATUS
} from 'store-consts';

function apiReq(url, method) {
  const state = store.getState();
  const userId = getUser(state);
  return fetch(`/api/${userId}/${url}`, { method });
}

export function getList() {
  return async function(dispatch) {
    const res = await apiReq('all', 'GET');
    switch (res.status) {
      case 200: {
        const data = await res.json();
        let refresh = false;
        
        for (const [projectId, projectData] of Object.entries(data)) {
          const { status, name, analysis } = projectData;
          dispatch(setProjectData(projectId, { status, name, analysis }));
          if (status === PROCESS_STATUS)
            refresh = true;
        }
        return refresh;
      }
      default: return true;
    }
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
        dispatch(delProject(projectId));
        if (selectedProjectId == projectId)
          dispatch(selProject(undefined));
        break;
      default:
        dispatch(queueSnackbar(`Project ${projectId} delete request failed`));
        break;
    }
  };
}
export function forkProject(projectId) {
  return async function(dispatch) {
    let state = store.getState();
    let project = getProjectData(state, projectId);
    if (project.status !== project.STATUSES.empty) {
      await dispatch(getCode(projectId));
      state = store.getState();
      project = getProjectData(state, projectId);
    }
    
    const forkProjectId = await dispatch(createProject());
    const { code, analysis } = project;
    const forkData = { code, analysis };
    dispatch(setProjectData(forkProjectId, forkData));
    dispatch(selProject(forkProjectId));
  };
}

export function rename(projectId, name) {
  return async function(dispatch) {
    const state = store.getState();
    const userId = getUser(state);
    dispatch(setProjectData(projectId, { name }));
    return fetch(`/api/${userId}/projects/${projectId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
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
    const { userId, status, STATUSES } = getProjectData(state, projectId);
  
    switch (status) {
      case STATUSES.empty:
      case STATUSES.edit: {
        let status = STATUSES.edit;
        if (code == '')
          status = STATUSES.empty;
        
        dispatch(setProjectData(projectId, { status, code }));
        return fetch(`/api/${userId}/projects/${projectId}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
      }
    }
  }
}
export function processCode(projectId, code, options) {
  return async function(dispatch) {
    dispatch(saveCode(projectId, code));

    const state = store.getState();
    const { userId } = getProjectData(state, projectId);
    const res = await fetch(`/api/${userId}/projects/${projectId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
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

export function getData(projectId) {
  return async function(dispatch) {
    const res = await apiReq(`projects/${projectId}/data`, 'GET');
    switch (res.status) {
      case 200: {
        const data = await res.json();
        dispatch(setProjectData(projectId, data));
        return res.status;
      }
      case 204: {
        return res.status;
      }
      case 412: {
        dispatch(queueSnackbar('Project data request rejected'));
        return res.status;
      }
    }
  };
}

export function importData(projectId, data) {
  return dispatch => {
    dispatch(addProject(projectId));
    dispatch(setProjectData(projectId, data));
    dispatch(generatePanels(projectId));
  }
}
export function exportData(projectId) {
  return async function(dispatch) {
    const status = await dispatch(getData(projectId));
    switch (status) {
      case 200: {
        // create blob
        const state = store.getState();
        const data = getProjectData(state, projectId);
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });

        // create elem
        const href = URL.createObjectURL(blob);
        const file = `aam-vis-${projectId}.json`
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
      case 204: {
        dispatch(queueSnackbar('Project still processing'));
        break;
      }
    }
  };
}
