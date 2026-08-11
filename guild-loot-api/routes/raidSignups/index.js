const express = require('express');
const buildRaidSignupTemplateRoutes = require('./templates');
const buildRaidSignupEventRoutes = require('./events');
const buildRaidSignupPublicRoutes = require('./public');
const buildRaidSignupEchoRoutes = require('./echo');
const buildRaidSignupAbsenceRoutes = require('./absences');

function buildRaidSignupRoutes({ db, sessionSecret }) {
  const router = express.Router();

  router.use(buildRaidSignupTemplateRoutes({ db }));
  router.use(buildRaidSignupEventRoutes({ db }));
  router.use(buildRaidSignupPublicRoutes({ db }));
  router.use(buildRaidSignupEchoRoutes({ db }));
  router.use(buildRaidSignupAbsenceRoutes({ db, sessionSecret }));

  return router;
}

module.exports = buildRaidSignupRoutes;
