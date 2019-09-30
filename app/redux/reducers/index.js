import { combineReducers } from 'redux';
import data from './data';
import notifications from './notifications';
import projects from './projects';

export default combineReducers({ data, notifications, projects });
