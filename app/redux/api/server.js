import store from '../store';
import { setProjectData } from '../actions/projects';
import { queueSnackbar } from '../actions/notifications'
import { getProjectData } from '../selectors/projects';

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
        queueSnackbar('Project process request rejected');
        break;
      }
    }
  }
}
