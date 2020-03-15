import store from 'store';

import { getGraphRefData } from 'fext/store/selectors';

import { refreshConfigs } from 'viewers/ConfigViewer';
import { refreshEnvs } from 'viewers/EnvViewer';
import { refreshStacks } from 'viewers/StackViewer';

/**
 * @returns {Function} dispatch
 */
export function nodeSelectHook() {
  return function(dispatch) {
    dispatch(refreshConfigs());
    dispatch(refreshEnvs());
    dispatch(refreshStacks());
  };
}

/**
 * @returns {Function} dispatch
 */
export function nodeUnselectHook() {
  return function(dispatch) {
    dispatch(refreshConfigs());
    dispatch(refreshEnvs());
    dispatch(refreshStacks());
  };
}

/**
 * @param {String} graphId graph id
 * @returns {Function} node data to append on cytoscape data import
 */
export function cyNodeDataHook(graphId) {
  const state = store.getState();
  const refData = getGraphRefData(state, graphId);

  /**
   * @param {String} nodeId node id
   * @returns {Object} node data to append to data imported into cytoscape
   */
  return function (nodeId) {
    let label = nodeId;
    if (refData[nodeId]) {
      const form = refData[nodeId].form;
      if (form)
        label += `\n${form}`;
    }
    return { label };
  };
}
