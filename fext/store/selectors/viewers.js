import store from 'store';
import { getProjectAnalysisOutput } from 'store/selectors';

import { CSTACK_STACK, FRAME_STACK } from 'fext/store/consts';

/**
 * @param {String} stackType stack type
 * @returns {Object} <{String} stackId, {Object} stackData> hashmap
 */
export function getStackRefData(stackType) {
  const state = store.getState();
  const analOut = getProjectAnalysisOutput(state);
  switch (stackType) {
    case CSTACK_STACK: return analOut.cstacks;
    case FRAME_STACK: return analOut.frames;
  }
}
