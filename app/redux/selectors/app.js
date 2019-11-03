import { createSelector } from 'reselect';
import { LOGIN_VIEW, LIST_VIEW, PROJECT_VIEW } from 'store-consts';

export const getUser = state => state.userId;
export const getSelectedProjectId = state => state.selectedProjectId;
export const getView = createSelector(
  getUser, getSelectedProjectId,
  (userId, projectId) => {
  if (!userId) return LOGIN_VIEW;
  if (!projectId) return LIST_VIEW;
  else return PROJECT_VIEW;
  }
);
export const getTitle = state => state.title;

export const getLabel = item => item.label;
