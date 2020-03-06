import store from 'store';
import { setPanels, defaultPanelState, refreshPanels } from 'store/actions';
import {
  getProjectAnalysisOutput,
  getPanels, getLabel
} from 'store/selectors';

import { CONFIG_PANEL, ENV_PANEL } from 'fext/store/consts';

export function refreshEnvs() {
  const state = store.getState();
  const analOut = getProjectAnalysisOutput(state);
  const configs = getPanels(state, CONFIG_PANEL);
  const visibleEnvs = [];
  for (const [configId, configPanel] of Object.entries(configs)) {
    if (!configPanel.hidden && configPanel.selected) {
      const stateIds = analOut.configs[configId].states;
      if (stateIds)
        for (const stateId of stateIds) {
          const state = analOut.states[stateId];
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
    const analOut = getProjectAnalysisOutput(state, projectId);

    const panels = {};
    for (const [envId, env] of Object.entries(analOut.envs)) {
      const vars = env.entries.map(entry => entry.label).join(', ');
      const name = getLabel(env) || envId;
      const label = `${name}: [ ${vars} ]`;

      panels[envId] = defaultPanelState(label);
    }
    dispatch(setPanels(projectId, ENV_PANEL, panels));
  };
}
