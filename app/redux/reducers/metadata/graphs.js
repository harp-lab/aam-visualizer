import { SET_GRAPH_METADATA } from 'store-action-types';

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
      const graph = state[graphId];
      return {
        ...state,
        [graphId]: {
          ...graph,
          ...data
        }
      };
    }
    default: return state;
  }
}

export default graphsReducer;
