import { getProjectMetadata } from './projects';

export function getPanels(store) {
  return getProjectMetadata(store).panels;
}
