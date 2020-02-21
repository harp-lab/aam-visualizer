import { combineReducers } from 'redux';
import { ADD_PANEL, SET_PANEL, SET_PANELS, REFRESH_PANELS } from 'store/actionTypes';
import { CONFIG_PANEL, ENV_PANEL, STACK_PANEL } from 'store/consts';

/**
 * project panel metadata state reducer
 * @param {Object} state 
 * @param {Object} action 
 * @param {String} action.type action type
 * @param {Object} action.payload action payload
 * @returns {Object} state
 */
function panelReducer(state = {}, action) {
  switch (action.type) {
    case ADD_PANEL: {
      const { panelId, label } = action.payload;
      return {
        ...state,
        [panelId]: {
          label,
          saved: false,
          hidden: true,
          selected: false
        }
      }
    }
    case SET_PANEL: {
      const { panelId, data } = action.payload
      const panel = state[panelId];
      return {
        ...state,
        [panelId]: {
          ...panel,
          ...data
        }
      }
    }
    case SET_PANELS: {
      const { data } = action.payload;
      return { ...data };
    }
    case REFRESH_PANELS: {
      const { func } = action.payload;
      const panels = {};
      for (const [panelId, data] of Object.entries(state)) {
        const newData = func(panelId, data);
        panels[panelId] = { ...data, ...newData };
      }
      return panels;
    }
    default: return state;
  }
}

/**
 * filter reducer factory with predicate
 * @param {Function} reducer state reducer
 * @param {Function} predicate 
 */
function filteredReducerFactory(reducer, predicate) {
  /**
   * @param {Object} state
   * @param {Object} action
   * @param {Object} state
   */
  return function(state, action) {
    const isInitCall = state === undefined;
    const shouldRun = predicate(action) || isInitCall;
    return shouldRun ? reducer(state, action) : state;
  };
}

const panelsReducer = combineReducers({
  configs: filteredReducerFactory(panelReducer, action => action.payload ? action.payload.type === CONFIG_PANEL : false),
  envs: filteredReducerFactory(panelReducer, action => action.payload ? action.payload.type === ENV_PANEL : false),
  stacks: filteredReducerFactory(panelReducer, action => action.payload ? action.payload.type === STACK_PANEL : false)
});

export default panelsReducer;
