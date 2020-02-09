import store from 'store';
import { STACK_PANEL, FRAME_STACK, CSTACK_STACK } from 'store-consts';
import { getStackId, defaultPanelState, setPanels, refreshPanels } from 'store-actions';
import {
  getProjectItems,
  getPanels, getLabel
} from 'store-selectors';

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
