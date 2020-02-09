import store from 'store';
import { setPanels, defaultPanelState, refreshPanels } from 'store-actions';
import { ENV_PANEL } from 'store-consts';
import {
  getProjectItems,
  getPanels, getLabel
} from 'store-selectors';

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
