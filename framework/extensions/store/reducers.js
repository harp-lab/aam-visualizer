import * as reducers from 'fext/store/reducers';

/**
 * guarantees reducer
 * @param {String} moduleName imported module name
 * @param {String} reducerName store reducer name
 * @returns {Function} reducer
 */
function reqReducer(moduleName, reducerName) {
  let reducer = moduleName[reducerName];
  if (!reducer)
    reducer = function(state = {}, action) {
      return state;
    };
  return reducer;
}

export const metadataReducer = reqReducer(reducers, 'metadataReducer');
