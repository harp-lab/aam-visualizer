import { delProjects } from 'store-actions';
import { SET_USER, SET_VIEW, SET_TITLE } from '../actionTypes';

const setUser = userId => ({
  type: SET_USER,
  payload: { userId }
});
export function login(userId) {
  return dispatch => {
    dispatch(setUser(userId));
  };
}
export function logout(userId) {
  return dispatch => {
    dispatch(setUser(undefined));
    dispatch(delProjects());
  };
}
export const setView = view => ({
  type: SET_VIEW,
  payload: { view }
});
export const setTitle = title => ({
  type: SET_TITLE,
  payload: { title }
})
