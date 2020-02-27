import { createSelector } from 'reselect';
import { getProjectMetadata } from './projects';

/**
 * @param {Object} state
 * @param {String} panelType panel type
 * @returns {Object} <{String} panelId, {Object} panelData> hashmap
 */
export const getPanels = createSelector(
  (state, panelType) => getProjectMetadata(state),
  (state, panelType) => panelType,
  (metadata, panelType) => metadata.panels[panelType] || {}
);
