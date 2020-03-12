import store from 'store';
import { setPanels, defaultPanelState, refreshPanels } from 'store/actions';
import {
  getProjectAnalysisOutput,
  getSelectedNodes,
  getLabel
} from 'store/selectors';

import { CONFIG_PANEL } from 'fext/store/consts';
import { getSubGraphId, getToggleGraphId } from 'fext/store/selectors';

export function generateConfigs(projectId) {
  return (dispatch, getState) => {
    const state = getState();
    const analOut = getProjectAnalysisOutput(state, projectId);

    const panels = {};
    for (const [configId, data] of Object.entries(analOut.configs)) {
      const { form, states } = data;
      let syntax;
      if (states) {
        const stateId = states[0];
        const state = analOut.states[stateId];
        switch (state.form) {
          case 'halt':
            if (state.results) {
              const results = state.results
                .map(resultId => {
                  const { type, name, valString } = analOut.vals[resultId];
    
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
            }
            break;
          default:
            syntax = state.exprString;
            break;
        }
      }
      const name = getLabel(data) || configId;
      const label = `${name}: ${form} - ${syntax}`;
  
      panels[configId] = defaultPanelState(label);
    }
    dispatch(setPanels(projectId, CONFIG_PANEL, panels));
  };
}

/**
 * refresh config panels based on selected subgraph nodes
 * @returns action
 */
export function refreshConfigs() {
  const state = store.getState();
  const subGraphId = getSubGraphId(state);
  const toggleGraphId = getToggleGraphId(state, subGraphId);
  const selectedConfigs = getSelectedNodes(state, toggleGraphId);
  return refreshPanels(CONFIG_PANEL, (panelId, data) => {
    if (selectedConfigs.includes(panelId)) {
      return { selected: true, hidden: false };
    } else {
      return { hidden: true };
    }
  });
}
