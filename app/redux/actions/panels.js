import store from '../store';
import { ADD_PANEL, SET_PANEL, SET_PANELS, REFRESH_PANELS } from '../actionTypes';
import { ENV_PANEL, STACK_PANEL, FRAME_STACK, CSTACK_STACK } from 'store-consts';
import {
  getSelectedProjectId, getProjectItems,
  getPanels, getLabel
} from 'store-selectors';

import { generateConfigs, refreshConfigs } from 'component-viewers/ConfigViewer';

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

export function hideStack(stackId, stackType) {
  const panelId = getStackId(stackId, stackType);
  return hidePanel(STACK_PANEL, panelId);
}
export function showStack(stackId, stackType) {
  const panelId = getStackId(stackId, stackType);
  return showPanel(STACK_PANEL, panelId);
}
export function saveStack(stackId, stackType) {
  const panelId = getStackId(stackId, stackType);
  return savePanel(STACK_PANEL, panelId);
}
export function unsaveStack(stackId, stackType) {
  const panelId = getStackId(stackId, stackType);
  return unsavePanel(STACK_PANEL, panelId);
}
export function selectStack(stackId, stackType) {
  const panelId = getStackId(stackId, stackType);
  return selectPanel(STACK_PANEL, panelId);
}
export function unselectStack(stackId, stackType) {
  const panelId = getStackId(stackId, stackType);
  return unselectPanel(STACK_PANEL, panelId);
}
function getStackId(stackId, stackType) {
  return `${stackType}-${stackId}`;
}

export const hideEnv = panelId => hidePanel(ENV_PANEL, panelId);
export const showEnv = panelId => showPanel(ENV_PANEL, panelId);
export const saveEnv = panelId => savePanel(ENV_PANEL, panelId);
export const unsaveEnv = panelId => unsavePanel(ENV_PANEL, panelId);
export const selectEnv = panelId => selectPanel(ENV_PANEL, panelId);
export const unselectEnv = panelId => unselectPanel(ENV_PANEL, panelId);

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
export function refreshEnvs() {
  const state = store.getState();
  const items = getProjectItems(state);
  const { configs } = getPanels(state);
  const visibleEnvs = [];
  for (const [configId, configPanel] of Object.entries(configs)) {
    if (!configPanel.hidden && configPanel.selected) {
      const stateIds = items.configs[configId].states;
      if (stateIds)
        for (const stateId of stateIds) {
          const state = items.states[stateId];
          const envId = state.env;
          if (envId)
            visibleEnvs.push(envId);
        }
    }
  }
  return refreshPanels(ENV_PANEL, (envId, panel) => {
    if (visibleEnvs.includes(envId))
      return { hidden: false };
    else
      return { hidden: true };
  });
}
export function refreshStacks() {
  const state = store.getState();
  const items = getProjectItems(state);
  const { configs } = getPanels(state);

  const visibleStacks = [];
  for (const [configId, configPanel] of Object.entries(configs)) {
    if (!configPanel.hidden && configPanel.selected) {
      const stateIds = items.configs[configId].states;
      if (stateIds)
        for (const stateId of stateIds) {
          const state = items.states[stateId];
          const { [FRAME_STACK]: frameId, [CSTACK_STACK]: cstackId } = state;
          const stackType = frameId ? FRAME_STACK : CSTACK_STACK;
          const stackId = frameId ? frameId : cstackId;
          const panelId = getStackId(stackId, stackType);
          visibleStacks.push(panelId);
        }
    }
  }
  return refreshPanels(STACK_PANEL, (stackId, panel) => {
    if (visibleStacks.includes(stackId))
      return { hidden: false };
    else
      return { hidden: true };
  });
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
export function generateEnvs(projectId) {
  return (dispatch, getState) => {
    const state = getState();
    const items = getProjectItems(state, projectId);

    const panels = {};
    for (const [envId, env] of Object.entries(items.envs)) {
      const vars = env.entries.map(entry => entry.label).join(', ');
      const name = getLabel(env) || envId;
      const label = `${name}: [ ${vars} ]`;

      panels[envId] = defaultPanelState(label);
    }
    dispatch(setPanels(projectId, ENV_PANEL, panels));
  };
}
export function generateStacks(projectId) {
  return (dispatch, getState) => {
    const state = getState();
    const items = getProjectItems(state, projectId);

    const panels = {};

    if (items.frames)
      for (const [frameId, frame] of Object.entries(items.frames)) {
        const { descs } = frame;
        const name = getLabel(frame) || frameId;
        let label = `${name}: `;
        if (descs.length > 1)
          label += `[ ${descs[0]}, ... +${descs.length - 1} ]`;
        else
          label += `[ ${descs[0]} ]`;
        const panelId = getStackId(frameId, FRAME_STACK);
        panels[panelId] = {
          ...defaultPanelState(label),
          frame: frameId
        };
      }

    if (items.cstacks)
      for (const [cstackId, cstack] of Object.entries(items.cstacks)) {
        const name = getLabel(cstack) || cstackId;
        let label = `${name}`;
        const panelId = getStackId(cstackId, CSTACK_STACK);
        panels[panelId] = {
          ...defaultPanelState(label),
          cstack: cstackId
        };
      }

    dispatch(setPanels(projectId, STACK_PANEL, panels));
  }
}
