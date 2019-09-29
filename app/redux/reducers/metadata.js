import { combineReducers } from 'redux';
import {
  SET_METADATA, SET_GRAPH_METADATA,
  ADD_PANEL, SET_PANEL
} from '../actionTypes';

function dataReducer(state = {}, action) {
  switch (action.type) {
    case SET_METADATA: {
      const { data } = action.payload;
      return { ...state, ...data };
    };
    default: return state;
  }
}

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

function createFilteredReducer(reducer, predicate) {
  return (state, action) => {
    const isInitCall = state === undefined;
    const shouldRun = predicate(action) || isInitCall;
    return shouldRun ? reducer(state, action) : state;
  };
}
function panelReducer(state = {}, action) {
  switch (action.type) {
    case ADD_PANEL: {
      const { id, label } = action.payload;
      return {
        ...state,
        [id]: {
          label,
          saved: false,
          hidden: false,
          selected: false
        }
      }
    }
    case SET_PANEL: {
      const { id, ...data } = action.payload
      const panel = state[id];
      return {
        ...state,
        [id]: {
          ...panel,
          ...data
        }
      }
    }
    default: return state;
  }
}
const panelsReducer = combineReducers({
  configs: createFilteredReducer(panelReducer, action => action.payload ? action.payload.type === 'config' : false),
  envs: createFilteredReducer(panelReducer, action => action.payload ? action.payload.type === 'env' : false),
  konts: createFilteredReducer(panelReducer, action => action.payload ? action.payload.type === 'kont' : false)
})

export default combineReducers({
  data: dataReducer,
  graphs: graphsReducer,
  panels: panelsReducer
});
