const express = require('express');
const buildRaidSignupTemplateRoutes = require('./templates');
const buildRaidSignupEventRoutes = require('./events');
const buildRaidSignupPublicRoutes = require('./public');
const buildRaidSignupEchoRoutes = require('./echo');

function buildRaidSignupRoutes({ db }) {
  const router = express.Router();

  router.use(buildRaidSignupTemplateRoutes({ db }));
  router.use(buildRaidSignupEventRoutes({ db }));
  router.use(buildRaidSignupPublicRoutes({ db }));
  router.use(buildRaidSignupEchoRoutes({ db }));

  return router;
}

module.exports = buildRaidSignupRoutes;
