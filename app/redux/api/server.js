import store from '../store';
import { setProjectData, delProject, selProject } from '../actions/projects';
import { queueSnackbar } from '../actions/notifications';
import { getUser } from '../selectors/data';
import { getSelectedProjectId, getProjectData } from '../selectors/projects';

export function deleteProject(projectId) {
  return async function(dispatch) {
    const state = store.getState();
    const userId = getUser(state);
    const selectedProjectId = getSelectedProjectId(state);
    const res = await fetch(`/api/${userId}/projects/${projectId}/delete`, { method: 'POST' });
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
    })
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
