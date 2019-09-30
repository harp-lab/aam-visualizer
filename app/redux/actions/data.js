import store from '../store';
import { SET_USER, SET_VIEW } from '../actionTypes';

export const setUser = userId => ({
  type: SET_USER,
  payload: { userId }
});
export const setView = view => ({
  type: SET_VIEW,
  payload: { view }
});
