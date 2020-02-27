import { SET_METADATA } from 'store/actionTypes';

import { metadataReducer as fextReducer } from 'extensions/store/reducers';

import graphsReducer from './graphs';
import panelsReducer from './panels';
import statusReducer from './status';

/**
 * project metadata state reducer
 * @param {Object} state 
 * @param {Object} action 
 * @param {String} action.type action type
 * @param {String} action.payload action payload
 * @returns {Object} state
 */
function metadataReducer(state = {}, action) {
  switch (action.type) {
    case SET_METADATA: {
      const { data } = action.payload;
      return { ...state, ...data };
    };
    default: {
      const { graphs, panels, status, fext } = state;
      return {
        ...state,
        graphs: graphsReducer(graphs, action),
        panels: panelsReducer(panels, action),
        status: statusReducer(status, action),
        fext: fextReducer(fext, action)
      };
    };
  }
}

export default metadataReducer;
