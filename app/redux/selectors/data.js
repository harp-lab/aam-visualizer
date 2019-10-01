export function getData(store) {
  return store.data;
}
export function getUser(store) {
  return getData(store).userId;
}
export function getView(store) {
  return getData(store).view;
}
export function getTitle(store) {
  return getData(store).title;
}
