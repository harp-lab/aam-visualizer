import { createSelector } from 'reselect';
import { PROJECT_UNDEFINED_NAME } from 'store/consts';
import { getSelectedProjectId } from 'store/selectors';

export const getProjects = state => state.projects;
export const getProjectIds = createSelector(
  getProjects,
  projects => Object.keys(projects)
);

/**
 * @param {Object} state 
 * @param {String} [projectId] project id
 * @returns {Object} project
 */
export const getProject = createSelector(
  (state, projectId) => projectId,
  getSelectedProjectId,
  getProjects,
  (projectId, selectedProjectId, projects) => {
    let project;
    if (projectId)
      project = projects[projectId];
    else
      project = projects[selectedProjectId];
    return project;
  }
);

/**
 * @param {Object} state
 * @param {String} [projectId] project id
 * @returns {String} project name
 */
export const getProjectName = createSelector(
  getProject,
  project => project ? project.name || PROJECT_UNDEFINED_NAME : undefined
);

/**
 * @param {Object} state
 * @param {String} [projectId] project id
 * @returns {Object} analysis output
 */
export const getProjectAnalysisOutput = createSelector(
  getProject,
  project => project.analysisOutput
);

export function getProjectServerStatus(store, projectId) {
  const { status } = getProject(store, projectId);
  return status;
}

/**
 * @param {Object} state
 * @param {String} [projectId] project id
 * @returns {Object} project metadata
 */
export const getProjectMetadata = createSelector(
  getProject,
  project => project.metadata
);

/**
 * @param {Object} state
 * @param {String} [projectId] project id
 * @returns {String} client status
 */
export const getProjectClientStatus = createSelector(
  getProjectMetadata,
  metadata => metadata.status.client
);
