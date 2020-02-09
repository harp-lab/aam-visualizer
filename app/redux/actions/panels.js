import store from '../store';
import { ADD_PANEL, SET_PANEL, SET_PANELS, REFRESH_PANELS } from '../actionTypes';
import { ENV_PANEL, STACK_PANEL } from 'store-consts';
import { getSelectedProjectId, getProjectItems } from 'store-selectors';

import { generateConfigs, refreshConfigs } from 'component-viewers/ConfigViewer';
import { generateEnvs, refreshEnvs } from 'component-viewers/EnvViewer';
import { generateStacks, refreshStacks } from 'component-viewers/StackViewer';

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

export function showStack(stackId, stackType) {
  const panelId = getStackId(stackId, stackType);
  return showPanel(STACK_PANEL, panelId);
}
export function getStackId(stackId, stackType) {
  return `${stackType}-${stackId}`;
}

export const showEnv = panelId => showPanel(ENV_PANEL, panelId);

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
export function refresh() {
  return dispatch => {
    dispatch(refreshConfigs());
    dispatch(refreshEnvs());
    dispatch(refreshStacks());
  };
}

export function generatePanels(projectId) {
  return (dispatch, getState) => {
    const state = getState();
    const items = getProjectItems(state, projectId);
    if (items.configs) dispatch(generateConfigs(projectId));
    if (items.envs) dispatch(generateEnvs(projectId));
    if (items.frames || items.cstacks) dispatch(generateStacks(projectId));
  };
}
export function defaultPanelState(label) {
  return {
    label,
    saved: false,
    hidden: true,
    selected: false
  };
};
