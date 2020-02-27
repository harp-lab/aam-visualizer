import * as hooks from 'fext/store/hooks';

/**
 * guarantees hook
 * @param {String} moduleName imported module name
 * @param {String} hookName store dispatcher function name
 * @returns {Function} dispatch
 */
function reqHook(moduleName, hookName) {
  let hook = moduleName[hookName];
  if (!hook) {
    hook = function() {
      return function(dispatch) {};
    };
  }
  return hook;
}

export const generateMetadataHook = reqHook(hooks, 'generateMetadataHook');
export const nodeSelectHook = reqHook(hooks, 'nodeSelectHook');
export const nodeUnselectHook = reqHook(hooks, 'nodeUnselectHook');
