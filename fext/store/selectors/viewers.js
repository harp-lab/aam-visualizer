import { createSelector } from 'reselect';
import store from 'store';
import { getProjectAnalysisOutput, getProjectMetadata, getSelectedNodes } from 'store/selectors';

import { CSTACK_STACK, FRAME_STACK } from 'fext/store/consts';
import { getToggleGraphId } from 'fext/store/selectors';

/**
 * @param {Object} state
 * @returns {String} main graph id
 */
export const getMainGraphId = createSelector(
  state => getProjectMetadata(state),
  metadata => metadata.mainGraphId || 'funcs'
);

/**
 * @param {Object} state
 * @returns {String} main graph toggle id
 */
export const getMainToggleGraphId = createSelector(
  state => getToggleGraphId(state, getMainGraphId(state)),
  mainToggleGraphId => mainToggleGraphId
);

/**
 * @param {Object} state
 * @returns {String} sub graph id
 */
export const getSubGraphId = createSelector(
  state => getSelectedNodes(state, getMainToggleGraphId(state)),
  state => getProjectAnalysisOutput(state),
  (selectedNodes, analysisOutput) => {
    let subGraphId = 'states';
    if (selectedNodes.length > 0) {
      const nodeId = selectedNodes[0];
      const { form } = analysisOutput.funcs[nodeId];
      const finalForms = ['halt', 'not found', 'non-func', 'unknown'];
      if (!finalForms.includes(form))
        subGraphId = nodeId;
    }
    return subGraphId;
  }
);

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
