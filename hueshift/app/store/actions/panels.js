import store from 'store';
import { ADD_PANEL, SET_PANEL, SET_PANELS, REFRESH_PANELS } from 'store/actionTypes';
import { getSelectedProjectId } from 'store/selectors';

function addPanel(projectId, type, panelId, label) {
  const state = store.getState();
  if (!projectId)
    projectId = getSelectedProjectId(state);
  return {
    type: ADD_PANEL,
    payload: {
      projectId,
      type,
      panelId,
      label
    }
  };
}

function setPanel(type, panelId, data) {
  const state = store.getState();
  const projectId = getSelectedProjectId(state);
  return {
    type: SET_PANEL,
    payload: {
      projectId,
      type,
      panelId,
      data
    }
  }
}
export function setPanels(projectId, type, data) {
  return {
    type: SET_PANELS,
    payload: {
      projectId,
      type,
      data
    }
  }
}
export const hidePanel = (type, panelId) => setPanel(type, panelId, { hidden: true });
export const showPanel = (type, panelId) => setPanel(type, panelId, { hidden: false });
export const savePanel = (type, panelId) => setPanel(type, panelId, { saved: true });
export const unsavePanel = (type, panelId) => setPanel(type, panelId, { saved: false });
export const selectPanel = (type, panelId) => setPanel(type, panelId, { selected: true });
export const unselectPanel = (type, panelId) => setPanel(type, panelId, { selected: false });

export function refreshPanels(type, func) {
  const state = store.getState();
  const projectId = getSelectedProjectId(state);
  return {
    type: REFRESH_PANELS,
    payload: {
      projectId,
      type,
      func
    }
  };
}

export function defaultPanelState(label) {
  return {
    label,
    saved: false,
    hidden: true,
    selected: false
  };
}
