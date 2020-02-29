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
