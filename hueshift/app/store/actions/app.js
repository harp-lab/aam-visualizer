import { SET_USER, SET_TITLE } from 'store/actionTypes';
import { selProject, delProjects } from 'store/actions';

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
    dispatch(selProject(undefined));
    dispatch(delProjects());
  };
}
export const setTitle = title => ({
  type: SET_TITLE,
  payload: { title }
})
