import store from '../store';
import { getSelectedProjectId, getProjectItems, getProject } from '../selectors/projects';
import { getSubGraphId, getGraphSelectedNodes } from '../selectors/graphs';
import { getPanels } from '../selectors/panels';
import { ADD_PANEL, SET_PANEL, REFRESH_PANELS } from '../actionTypes';

function addPanel(type, panelId, label) {
  const state = store.getState();
  const projectId = getSelectedProjectId(state);
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
export const addConfig = (panelId, label) => addPanel('config', panelId, label);
export const addEnv = (panelId, label) => addPanel('env', panelId, label);
export const addKont = (panelId, label) => addPanel('kont', panelId, label);

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
const hidePanel = (type, panelId) => setPanel(type, panelId, { hidden: true });
const showPanel = (type, panelId) => setPanel(type, panelId, { hidden: false });
const savePanel = (type, panelId) => setPanel(type, panelId, { saved: true });
const unsavePanel = (type, panelId) => setPanel(type, panelId, { saved: false });
const selectPanel = (type, panelId) => setPanel(type, panelId, { selected: true });
const unselectPanel = (type, panelId) => setPanel(type, panelId, { selected: false });

export const hideConfig = panelId => hidePanel('config', panelId);
export const showConfig = panelId => showPanel('config', panelId);
export const saveConfig = panelId => savePanel('config', panelId);
export const unsaveConfig = panelId => unsavePanel('config', panelId);
export const selectConfig = panelId => selectPanel('config', panelId);
export const unselectConfig = panelId => unselectPanel('config', panelId);

export const hideKont = panelId => hidePanel('kont', panelId);
export const showKont = panelId => showPanel('kont', panelId);
export const saveKont = panelId => savePanel('kont', panelId);
export const unsaveKont = panelId => unsavePanel('kont', panelId);
export const selectKont = panelId => selectPanel('kont', panelId);
export const unselectKont = panelId => unselectPanel('kont', panelId);

export const hideEnv = panelId => hidePanel('env', panelId);
export const showEnv = panelId => showPanel('env', panelId);
export const saveEnv = panelId => savePanel('env', panelId);
export const unsaveEnv = panelId => unsavePanel('env', panelId);
export const selectEnv = panelId => selectPanel('env', panelId);
export const unselectEnv = panelId => unselectPanel('env', panelId);

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
export function refreshConfigs() {
  const state = store.getState();
  const subGraphId = getSubGraphId(state);
  const selectedConfigs = getGraphSelectedNodes(state, subGraphId);
  return refreshPanels('config', (panelId, data) => {
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
  return refreshPanels('env', (envId, panel) => {
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
  return refreshPanels('kont', (kontId, panel) => {
    if (visibleKonts.includes(kontId))
      return { hidden: false };
    else
      return { hidden: true };
  });
}

export function generateConfigs() {
  return dispatch => {
    const state = store.getState();
    const items = getProjectItems(state);
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
  
      dispatch(addConfig(configId, label));
    }
  };
}
export function generateEnvs() {
  return dispatch => {
    const state = store.getState();
    const items = getProjectItems(state);
    for (const [envId, data] of Object.entries(items.envs)) {
      const vars = data.map(entry => entry.varString).join(', ');
      const label = `${envId}: [ ${vars} ]`;

      dispatch(addEnv(envId, label));
    }
  };
}
export function generateKonts() {
  return dispatch => {
    const state = store.getState();
    const items = getProjectItems(state);
    for (const [kontId, kont] of Object.entries(items.konts)) {
      const { descs } = items.konts[kontId];
      let label;
      if (descs.length > 1)
        label = `[ ${descs[0]}, ... +${descs.length - 1} ]`;
      else
        label = `[ ${descs[0]} ]`;
      dispatch(addKont(kontId, label))
    }
  };
}
