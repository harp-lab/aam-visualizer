import { combineReducers } from 'redux';
import notifications from './notifications';
import projects from './projects';

export default combineReducers({ notifications, projects });
