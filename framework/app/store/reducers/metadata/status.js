import { SET_STATUS } from 'store/actionTypes';
import { CLIENT_WAITING_STATUS } from 'store/consts';

/**
 * project status metadata state reducer
 * @param {Object} state 
 * @param {Object} action 
 * @param {String} action.type action type
 * @param {Object} action.payload action payload
 * @returns {Object} state
 */
function statusReducer(state = {
  client: CLIENT_WAITING_STATUS
}, action) {
  switch (action.type) {
    case SET_STATUS: {
      const { data } = action.payload;
      return { ...state, ...data };
    }
    default: return state;
  }
}

export default statusReducer;
