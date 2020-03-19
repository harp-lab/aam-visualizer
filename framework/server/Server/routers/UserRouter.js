const express = require('express');

const ProjectRouter = require('./ProjectRouter');

/**
 * generate user request express router
 * @param {Object} server {Server} instance
 */
function UserRouter(server) {
  const router = express.Router({ mergeParams: true });

  /** send project list */
  router.get('/all', (req, res) => {
    res.json(server.getProjectList(req.params.userId))
      .status(200).end();
  });

  /** create new project */
  router.post('/create', async (req, res) => {
    const projectId = await server.createProject(req.params.userId);
    res.json({ id: projectId })
      .status(200).end();
  });

  /** subrouter */
  router.use('/projects/:projectId', ProjectRouter(server));

  return router;
}

module.exports = UserRouter;
