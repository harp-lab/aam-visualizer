import { combineReducers } from 'redux';
import {
  SET_PROJECT_DATA, SET_PANEL_SAVED, SET_PANEL_HIDDEN, SET_PANEL_SELECTED,
} from '../actionTypes';
import metadataReducer from './metadata';

const initialState = {
  status: 'empty',
  STATUSES: {
    empty: 'empty',
    edit: 'edit',
    process: 'process',
    done: 'done',
    error: 'error'
  },
  code: ''
};

function dataReducer(state = initialState, action) {
  switch (action.type) {
    case SET_PROJECT_DATA: {
      const { data } = action.payload;
      return { ...state, ...data };
    };
    default: return state;
  }
}

export default combineReducers({ data: dataReducer, metadata: metadataReducer });
