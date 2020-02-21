import store from 'store';
import { setPanels, defaultPanelState, refreshPanels } from 'store/actions';
import { CONFIG_PANEL } from 'store/consts';
import {
  getProjectItems,
  getSubGraphId, getSelectedNodes,
  getLabel
} from 'store/selectors';

export function generateConfigs(projectId) {
  return (dispatch, getState) => {
    const state = getState();
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
            if (state.results) {
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

export function refreshConfigs() {
  const state = store.getState();
  const subGraphId = getSubGraphId(state);
  const selectedConfigs = getSelectedNodes(state, subGraphId);
  return refreshPanels(CONFIG_PANEL, (panelId, data) => {
    if (selectedConfigs.includes(panelId)) {
      return { selected: true, hidden: false };
    } else {
      return { hidden: true };
    }
  });
}
