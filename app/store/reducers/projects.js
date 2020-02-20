import { ADD_PROJECT, SET_PROJECT_DATA, DEL_PROJECT, DEL_PROJECTS } from '../actionTypes';
import projectReducer from './project';

function projectsReducer(state = {}, action) {
  switch (action.type) {
    case ADD_PROJECT:
    case SET_PROJECT_DATA:
    default: {
      if (action.payload && action.payload.projectId) {
        const { projectId } = action.payload;
        const project = state[projectId];
        return {
          ...state,
          [projectId]: projectReducer(project, action)
        };
      }
      return state;
    }
    case DEL_PROJECT: {
      const { projectId } = action.payload;
      const {[projectId]: project, ...projects} = state;
      return { ...projects };
    }
    case DEL_PROJECTS: return {};
  }
}

export default projectsReducer;
