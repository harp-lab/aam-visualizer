import { SET_GRAPH_METADATA } from 'store/actionTypes';

/**
 * project graph metadata state reducer
 * @param {Object} state 
 * @param {Object} action 
 * @param {String} action.type action type
 * @param {Object} action.payload action payload
 * @returns {Object} state
 */
function graphsReducer(state = {}, action) {
  switch (action.type) {
    case SET_GRAPH_METADATA: {
      const { graphId, data } = action.payload;
      const metadata = state[graphId];
      return {
        ...state,
        [graphId]: {
          ...metadata,
          ...data
        }
      };
    }
    default: return state;
  }
}

export default graphsReducer;
