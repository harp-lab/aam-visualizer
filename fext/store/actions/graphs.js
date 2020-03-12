import store from 'store';
import { setGraphMetadata } from 'store/actions';

import { getBubbling } from 'fext/store/selectors';

/**
 * Toggle bubbling state of graph
 * @param {String} graphId 
 */
export function toggleBubbling(graphId) {
  const state = store.getState();
  const bubbled = getBubbling(state, graphId);
  return setGraphMetadata(graphId, { bubbled: !bubbled });
}
