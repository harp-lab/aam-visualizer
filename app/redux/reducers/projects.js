import {
  ADD_PROJECT, SET_PROJECT_DATA, SET_PANEL_SAVED, SET_PANEL_HIDDEN, SET_PANEL_SELECTED,
  SET_PROJECTS, SET_PROJECT, DEL_PROJECT, SEL_PROJECT,
  SHOW_ENV, SHOW_KONT
} from '../actionTypes';
import projectReducer from './project';
import { combineReducers } from 'redux';

function dataReducer(state = {
  selectedProjectId: undefined
}, action) {
  switch (action.type) {
    case SEL_PROJECT: {
      const { projectId } = action.payload;
      return {
        ...state,
        selectedProjectId: projectId
      };
    }
    default: return state;
  }
}
function projectsReducer(state = {}, action) {
  switch (action.type) {
    case ADD_PROJECT:
    case SET_PROJECT_DATA: {
      const { projectId } = action.payload;
      const project = state[projectId];
      return {
        ...state,
        [projectId]: projectReducer(project, action)
      };
    }
    case DEL_PROJECT: {
      const { projectId } = action.payload;
      const {[projectId]: project, ...projects} = state;
      return {
        ...state,
        projects
      };
    }
    default: {
      const nextState = {};
      for (const [projectId, project] of Object.entries(state)) {
        nextState[projectId] = projectReducer(project, action);
      }
      return nextState;
    }
  }
}

export default combineReducers({ data: dataReducer, projects: projectsReducer });