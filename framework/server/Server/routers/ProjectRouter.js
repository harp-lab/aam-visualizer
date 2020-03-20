const express = require('express');

const { ENGINE_DISABLED } = require('../../Consts');

/**
 * generate project request express router
 * @param {Object} server {Server} instance
 */
function ProjectRouter(server) {
  const router = express.Router({ mergeParams: true });

  /** project id check */
  router.all('*', (req, res, next) => {
    const projectId = req.params.projectId;
    if (server.projects[projectId])
      next();
    else
      res.status(404).end();
  });


  /** send project analysis input */
  router.get('/code', (req, res) => {
    const projectId = req.params.projectId;
    const project = server.projects[projectId];
    res.json({ id: projectId, analysisInput: project.analysisInput })
      .status(200).end();
  });

  /** send project analysis output */
  router.get('/data', (req, res) => {
    const projectId = req.params.projectId;
    const project = server.projects[projectId];
    switch (project.status) {
      case project.STATUSES.done:
      case project.STATUSES.error:
        res.json(project.export(projectId))
          .status(200).end();
        break;
      case project.STATUSES.process:
        res.status(204).end();
        break;
      default:
        res.status(412).end();
        break;
    }
  });

  /** store project analysis input */
  router.post('/save', async (req, res) => {
    const projectId = req.params.projectId;
    const data = req.body;
    await server.saveProject(projectId, data);
    res.status(202).end();
  });


  /** clear project data */
  router.post('/clear', async (req, res) => {
    const { projectId } = req.params;
    const data = req.body;
    const project = server.projects[projectId];

    for (const key of Object.keys(data)) {
      data[key] = undefined;
    }

    switch (project.status) {
      case project.STATUSES.empty:
      case project.STATUSES.edit:
        server.saveProject(projectId, data);
        res.status(200).end();
        break;
      default:
        res.status(412).end();
        break;
    }
  });

  /** process project */
  router.post('/process', async (req, res) => {
    if (ENGINE_DISABLED) {
      res.status(405).end();
      return;
    }

    const projectId = req.params.projectId;
    const project = server.projects[projectId];
    switch (project.status) {
      case project.STATUSES.edit:
        const options = req.body;
        project.analysis = options.analysis;
        await server.processProject(projectId);
        res.status(200).end();
        break;
      default:
        res.status(412).end();
        break;
    }
  });

  /** cancel project processing */
  router.post('/cancel', async (req, res) => {
    if (ENGINE_DISABLED) {
      res.status(405).end();
      return;
    }
    
    const projectId = req.params.projectId;
    const project = server.projects[projectId];
    switch (project.status) {
      case project.STATUSES.process:
        await server.cancelProject(projectId);
        res.status(200).end();
        break;
      case project.STATUSES.done:
        res.status(409).end();
        break;
      default:
        res.status(406).end();
        break;
    }
  });

  /** delete project */
  router.post('/delete', async (req, res) => {
    const projectId = req.params.projectId;
    const project = server.projects[projectId];
    switch (project.status) {
      case project.STATUSES.process:
        res.status(409).end();
        break;
      default:
        await server.deleteProject(projectId);
        res.status(205).end();
        break;
    }
  });

  return router;
}

module.exports = ProjectRouter;
