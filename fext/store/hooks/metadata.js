import { generatePanels } from 'fext/store/actions';

/**
 * @param {String} projectId projectId
 * @returns {Function} dispatch
 */
export function generateMetadataHook(projectId) {
  return function(dispatch) {
    dispatch(generatePanels(projectId));
  };
}
