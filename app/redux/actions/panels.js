import store from '../store';
import { ADD_PANEL, SET_PANEL, SET_PANELS, REFRESH_PANELS } from '../actionTypes';
import { CONFIG_PANEL, ENV_PANEL, KONT_PANEL } from 'store-consts';
import {
  getSelectedProjectId, getProjectItems,
  getSubGraphId, getGraphSelectedNodes,
  getPanels
} from 'store-selectors';

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
export const addConfig = (projectId, panelId, label) => addPanel(projectId, CONFIG_PANEL, panelId, label);
export const addEnv = (projectId, panelId, label) => addPanel(projectId, ENV_PANEL, panelId, label);
export const addKont = (projectId, panelId, label) => addPanel(projectId, KONT_PANEL, panelId, label);

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
function setPanels(projectId, type, data) {
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

export const hideConfig = panelId => hidePanel(CONFIG_PANEL, panelId);
export const showConfig = panelId => showPanel(CONFIG_PANEL, panelId);
export const saveConfig = panelId => savePanel(CONFIG_PANEL, panelId);
export const unsaveConfig = panelId => unsavePanel(CONFIG_PANEL, panelId);
export const selectConfig = panelId => selectPanel(CONFIG_PANEL, panelId);
export const unselectConfig = panelId => unselectPanel(CONFIG_PANEL, panelId);

export const hideKont = panelId => hidePanel(KONT_PANEL, panelId);
export const showKont = panelId => showPanel(KONT_PANEL, panelId);
export const saveKont = panelId => savePanel(KONT_PANEL, panelId);
export const unsaveKont = panelId => unsavePanel(KONT_PANEL, panelId);
export const selectKont = panelId => selectPanel(KONT_PANEL, panelId);
export const unselectKont = panelId => unselectPanel(KONT_PANEL, panelId);

export const hideEnv = panelId => hidePanel(ENV_PANEL, panelId);
export const showEnv = panelId => showPanel(ENV_PANEL, panelId);
export const saveEnv = panelId => savePanel(ENV_PANEL, panelId);
export const unsaveEnv = panelId => unsavePanel(ENV_PANEL, panelId);
export const selectEnv = panelId => selectPanel(ENV_PANEL, panelId);
export const unselectEnv = panelId => unselectPanel(ENV_PANEL, panelId);

function refreshPanels(type, func) {
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
    dispatch(refreshKonts());
  };
}
export function refreshConfigs() {
  const state = store.getState();
  const subGraphId = getSubGraphId(state);
  const selectedConfigs = getGraphSelectedNodes(state, subGraphId);
  return refreshPanels(CONFIG_PANEL, (panelId, data) => {
    if (selectedConfigs.includes(panelId)) {
      return { selected: true, hidden: false };
    } else {
      return { hidden: true };
    }
  });
}
export function refreshEnvs() {
  const state = store.getState();
  const items = getProjectItems(state);
  const { configs, envs } = getPanels(state);
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
export function refreshKonts() {
  const state = store.getState();
  const items = getProjectItems(state);
  const { configs, konts } = getPanels(state);
  const visibleKonts = [];
  for (const [configId, configPanel] of Object.entries(configs)) {
    if (!configPanel.hidden && configPanel.selected) {
      const stateIds = items.configs[configId].states;
      if (stateIds)
        for (const stateId of stateIds) {
          const kontId = items.states[stateId].kont;
          visibleKonts.push(kontId);
        }
    }
  }
  return refreshPanels(KONT_PANEL, (kontId, panel) => {
    if (visibleKonts.includes(kontId))
      return { hidden: false };
    else
      return { hidden: true };
  });
}

export function generatePanels(projectId) {
  return dispatch => {
    const state = store.getState();
    const items = getProjectItems(state, projectId);
    if (items.configs) dispatch(generateConfigs(projectId));
    if (items.envs) dispatch(generateEnvs(projectId));
    if (items.konts) dispatch(generateKonts(projectId));
  };
}
function defaultPanelState(label) {
  return {
    label,
    saved: false,
    hidden: true,
    selected: false
  };
};
export function generateConfigs(projectId) {
  return dispatch => {
    const state = store.getState();
    const items = getProjectItems(state, projectId);

    const panels = {};
    for (const [configId, data] of Object.entries(items.configs)) {
      const { form, states } = data;
      let syntax;
      if (states) {
        const stateId = states[0];
        const state = items.states[stateId];
        switch (state.form) {
          case 'halt':
            const results = state.results
              .map(resultId => {
                const { type, name, valString } = items.vals[resultId];
  
                let string;
                switch (type) {
                  case 'closure':
                    string = name;
                    break;
                  case 'bool':
                    string = valString;
                    break;
                }
                return string;
              })
              .join(', ');
            syntax = `[ ${results} ]`
            break;
          default:
            syntax = state.exprString;
            break;
        }
      }
      const label = `${configId}: ${form} - ${syntax}`;
  
      panels[configId] = defaultPanelState(label);
    }
    dispatch(setPanels(projectId, CONFIG_PANEL, panels));
  };
}
export function generateEnvs(projectId) {
  return dispatch => {
    const state = store.getState();
    const items = getProjectItems(state, projectId);

    const panels = {};
    for (const [envId, data] of Object.entries(items.envs)) {
      const vars = data.map(entry => entry.varString).join(', ');
      const label = `${envId}: [ ${vars} ]`;

      panels[envId] = defaultPanelState(label);
    }
    dispatch(setPanels(projectId, ENV_PANEL, panels));
  };
}
export function generateKonts(projectId) {
  return dispatch => {
    const state = store.getState();
    const items = getProjectItems(state, projectId);

    const panels = {};
    for (const [kontId, kont] of Object.entries(items.konts)) {
      const { descs } = items.konts[kontId];
      let label = `${kontId}: `;
      if (descs.length > 1)
        label += `[ ${descs[0]}, ... +${descs.length - 1} ]`;
      else
        label += `[ ${descs[0]} ]`;

      panels[kontId] = defaultPanelState(label);
    }
    dispatch(setPanels(projectId, KONT_PANEL, panels));
  };
}
