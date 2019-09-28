import {
  SET_PROJECTS, SET_PROJECT, DEL_PROJECT, SEL_PROJECT,
  SHOW_ENV, SHOW_KONT
} from '../actionTypes';

const initialState = {
  projects: {},
  selectedProjectId: undefined
};

export default function(state = initialState, action) {
  switch (action.type) {
    case SET_PROJECTS: {
      const { projects } = action.payload;
      return {
        ...state,
        projects
      };
    }
    case SET_PROJECT: {
      const { id, project } = action.payload;
      return {
        ...state,
        projects: {
          ...state.projects,
          [id]: project
        }
      };
    }
    case DEL_PROJECT: {
      const { id } = action.payload;
      const {[id]: project, ...projects} = state.projects;
      return {
        ...state,
        projects
      };
    }
    case SEL_PROJECT: {
      const { id } = action.payload;
      return {
        ...state,
        selectedProjectId: id
      };
    }
    case SHOW_ENV: {
      const { id } = action.payload;
      const { projects, selectedProjectId } = state;
      const { metadata } = projects[selectedProjectId];
      const { envs } = metadata;
      envs[id].show();
      
      return {
        ...state,
        projects: {
          ...projects,
          [selectedProjectId]: {
            ...projects[selectedProjectId],
            metadata: {
              ...metadata,
              envs
            }
          }
        }
      };
    }
    case SHOW_KONT: {

    }
    default: return state;
  }
}
function update(object, data) {
  return { ...object, data };
}
function setProject(projects, project) {
  return update(projects, project);
}
function setMetadata(project, metadata) {
  return update(project, metadata);
}
