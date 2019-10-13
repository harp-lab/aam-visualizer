import { SET_USER, SET_TITLE, SEL_PROJECT } from '../actionTypes';
import notificationsReducer from './notifications';
import projectsReducer from './projects';

function reducer(state = {}, action) {
  switch (action.type) {
    case SET_USER: {
      const { userId } = action.payload;
      return { ...state, userId };
    }
    case SET_TITLE: {
      const { title } = action.payload;
      return { ...state, title };
    }
    case SEL_PROJECT: {
      const { projectId } = action.payload;
      return {
        ...state,
        selectedProjectId: projectId
      };
    }
    default: {
      const { notifications, projects } = state;
      return {
        ...state,
        notifications: notificationsReducer(notifications, action),
        projects: projectsReducer(projects, action)
      }
    }
  }
}

export default reducer;
