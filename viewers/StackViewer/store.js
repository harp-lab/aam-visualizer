import store from 'store';
import { defaultPanelState, setPanels, refreshPanels } from 'store/actions';
import {
  getProjectAnalysisOutput,
  getPanels, getLabel
} from 'store/selectors';

import { getStackId } from 'fext/store/actions';
import { CONFIG_PANEL, STACK_PANEL, FRAME_STACK, CSTACK_STACK } from 'fext/store/consts';

export function refreshStacks() {
  const state = store.getState();
  const analOut = getProjectAnalysisOutput(state);
  const configs = getPanels(state, CONFIG_PANEL);

  const visibleStacks = [];
  for (const [configId, configPanel] of Object.entries(configs)) {
    if (!configPanel.hidden && configPanel.selected) {
      const stateIds = analOut.configs[configId].states;
      if (stateIds)
        for (const stateId of stateIds) {
          const state = analOut.states[stateId];
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

export function generateStacks(projectId) {
  return (dispatch, getState) => {
    const state = getState();
    const analOut = getProjectAnalysisOutput(state, projectId);

    const panels = {};

    if (analOut.frames)
      for (const [frameId, frame] of Object.entries(analOut.frames)) {
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

    if (analOut.cstacks)
      for (const [cstackId, cstack] of Object.entries(analOut.cstacks)) {
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
