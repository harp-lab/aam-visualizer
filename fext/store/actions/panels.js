import { showPanel } from 'store/actions';
import { getProjectAnalysisOutput } from 'store/selectors';

import { ENV_PANEL, STACK_PANEL } from 'fext/store/consts';

import { generateConfigs } from 'viewers/ConfigViewer';
import { generateEnvs } from 'viewers/EnvViewer';
import { generateStacks } from 'viewers/StackViewer';

/**
 * @param {String} stackId stack id
 * @param {String} stackType stack type
 * @returns {String} panel id
 */
export function getStackId(stackId, stackType) {
  return `${stackType}-${stackId}`;
}

/**
 * @param {String} stackId stack id
 * @param {String} stackType stack type
 * @returns {Object} action
 */
export function showStack(stackId, stackType) {
  const panelId = getStackId(stackId, stackType);
  return showPanel(STACK_PANEL, panelId);
}

/**
 * @param {String} panelId panel id
 * @returns {Object} action
 */
export function showEnv(panelId) {
  return showPanel(ENV_PANEL, panelId);
}

/**
 * @param {String} projectId project id
 * @returns {Function} dispatch
 */
export function generatePanels(projectId) {
  return function(dispatch, getState) {
    const state = getState();
    const analOut = getProjectAnalysisOutput(state, projectId);
    if (analOut.configs) dispatch(generateConfigs(projectId));
    if (analOut.envs) dispatch(generateEnvs(projectId));
    if (analOut.frames || analOut.cstacks) dispatch(generateStacks(projectId));
  };
}
