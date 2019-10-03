import { getSelectedProjectId } from 'store-selectors';
import { LOGIN_VIEW, LIST_VIEW, PROJECT_VIEW } from 'store-consts';

export function getData(store) {
  return store.data;
}
export function getUser(store) {
  return getData(store).userId;
}
export function getView(store) {
  const userId = getUser(store);
  const projectId = getSelectedProjectId(store);
  if (!userId)
    return LOGIN_VIEW;
  if (!projectId)
    return LIST_VIEW;
  else
    return PROJECT_VIEW;
}
export function getTitle(store) {
  return getData(store).title;
}
