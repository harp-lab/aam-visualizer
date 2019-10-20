import { combineReducers } from 'redux';
import {
  SET_METADATA, SET_STATUS, SET_GRAPH_METADATA,
  ADD_PANEL, SET_PANEL, SET_PANELS, REFRESH_PANELS
} from '../actionTypes';
import { CONFIG_PANEL, ENV_PANEL, KONT_PANEL } from 'store-consts';

function metadataReducer(state = {}, action) {
  switch (action.type) {
    case SET_METADATA: {
      const { data } = action.payload;
      return { ...state, ...data };
    };
    default: {
      const { graphs, panels, status } = state;
      return {
        ...state,
        graphs: graphsReducer(graphs, action),
        panels: panelsReducer(panels, action),
        status: statusReducer(status, action)
      };
    };
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
const panelsReducer = combineReducers({
  configs: createFilteredReducer(panelReducer, action => action.payload ? action.payload.type === CONFIG_PANEL : false),
  envs: createFilteredReducer(panelReducer, action => action.payload ? action.payload.type === ENV_PANEL : false),
  konts: createFilteredReducer(panelReducer, action => action.payload ? action.payload.type === KONT_PANEL : false)
});

function statusReducer(state = {}, action) {
  switch (action.type) {
    case SET_STATUS: {
      const { data } = action.payload;
      return { ...state, ...data };
    }
    default: return state;
  }
}

export default metadataReducer;
