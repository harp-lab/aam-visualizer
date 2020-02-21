import { createSelector } from 'reselect';
import { getProjectMetadata } from './projects';

export const getPanels = createSelector(
  getProjectMetadata,
  metadata => metadata.panels
);
