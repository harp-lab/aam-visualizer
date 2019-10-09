import store from '../store';
import { getSelectedProjectId, getProjectItems, getProject } from '../selectors/projects';
import { getSubGraphId, getGraphSelectedNodes } from '../selectors/graphs';
import { getPanels } from '../selectors/panels';
import { ADD_PANEL, SET_PANEL, REFRESH_PANELS } from '../actionTypes';

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
export const addConfig = (projectId, panelId, label) => addPanel(projectId, 'configs', panelId, label);
export const addEnv = (projectId, panelId, label) => addPanel(projectId, 'envs', panelId, label);
export const addKont = (projectId, panelId, label) => addPanel(projectId, 'konts', panelId, label);

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
export const hidePanel = (type, panelId) => setPanel(type, panelId, { hidden: true });
export const showPanel = (type, panelId) => setPanel(type, panelId, { hidden: false });
export const savePanel = (type, panelId) => setPanel(type, panelId, { saved: true });
export const unsavePanel = (type, panelId) => setPanel(type, panelId, { saved: false });
export const selectPanel = (type, panelId) => setPanel(type, panelId, { selected: true });
export const unselectPanel = (type, panelId) => setPanel(type, panelId, { selected: false });

export const hideConfig = panelId => hidePanel('configs', panelId);
export const showConfig = panelId => showPanel('configs', panelId);
export const saveConfig = panelId => savePanel('configs', panelId);
export const unsaveConfig = panelId => unsavePanel('configs', panelId);
export const selectConfig = panelId => selectPanel('configs', panelId);
export const unselectConfig = panelId => unselectPanel('configs', panelId);

export const hideKont = panelId => hidePanel('konts', panelId);
export const showKont = panelId => showPanel('konts', panelId);
export const saveKont = panelId => savePanel('konts', panelId);
export const unsaveKont = panelId => unsavePanel('konts', panelId);
export const selectKont = panelId => selectPanel('konts', panelId);
export const unselectKont = panelId => unselectPanel('konts', panelId);

export const hideEnv = panelId => hidePanel('envs', panelId);
export const showEnv = panelId => showPanel('envs', panelId);
export const saveEnv = panelId => savePanel('envs', panelId);
export const unsaveEnv = panelId => unsavePanel('envs', panelId);
export const selectEnv = panelId => selectPanel('envs', panelId);
export const unselectEnv = panelId => unselectPanel('envs', panelId);

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
  return refreshPanels('configs', (panelId, data) => {
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
  return refreshPanels('envs', (envId, panel) => {
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
  return refreshPanels('konts', (kontId, panel) => {
    if (visibleKonts.includes(kontId))
      return { hidden: false };
    else
      return { hidden: true };
  });
}

export function generateConfigs(projectId) {
  return dispatch => {
    const state = store.getState();
    const items = getProjectItems(state, projectId);
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
  
      dispatch(addConfig(projectId, configId, label));
    }
  };
}
export function generateEnvs(projectId) {
  return dispatch => {
    const state = store.getState();
    const items = getProjectItems(state, projectId);
    for (const [envId, data] of Object.entries(items.envs)) {
      const vars = data.map(entry => entry.varString).join(', ');
      const label = `${envId}: [ ${vars} ]`;

      dispatch(addEnv(projectId, envId, label));
    }
  };
}
export function generateKonts(projectId) {
  return dispatch => {
    const state = store.getState();
    const items = getProjectItems(state, projectId);
    for (const [kontId, kont] of Object.entries(items.konts)) {
      const { descs } = items.konts[kontId];
      let label;
      if (descs.length > 1)
        label = `[ ${descs[0]}, ... +${descs.length - 1} ]`;
      else
        label = `[ ${descs[0]} ]`;
      dispatch(addKont(projectId, kontId, label))
    }
  };
}
