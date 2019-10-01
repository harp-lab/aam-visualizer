import { SET_USER, SET_VIEW, SET_TITLE } from '../actionTypes';

export const setUser = userId => ({
  type: SET_USER,
  payload: { userId }
});
export const setView = view => ({
  type: SET_VIEW,
  payload: { view }
});
export const setTitle = title => ({
  type: SET_TITLE,
  payload: { title }
})
