const express = require('express');
const buildAdminOfficerRolesRoutes = require('./admin/officerRoles');
const buildAdminDiscordBotConfigRoutes = require('./admin/discordBotConfig');
const buildAdminPlayerStatsRoutes = require('./admin/playerStats');
const buildAdminRaidLogsRoutes = require('./admin/raidLogs');
const buildAdminScoringConfigRoutes = require('./admin/scoringConfig');
const buildAdminRaidAssignmentDataRoutes = require('./admin/raidAssignmentData');
const buildAdminRaidAssignmentConfigRoutes = require('./admin/raidAssignmentConfig');
const buildAdminRaidAssignmentImagesRoutes = require('./admin/raidAssignmentImages');
const buildAdminSiteVisibilityRoutes = require('./admin/siteVisibility');

function buildAdminRoutes({ db, configService, sessionSecret }) {
  const router = express.Router();

  router.use(buildAdminOfficerRolesRoutes({ db, sessionSecret }));
  router.use(buildAdminDiscordBotConfigRoutes({ db, configService }));
  router.use(buildAdminPlayerStatsRoutes({ db }));
  router.use(buildAdminRaidLogsRoutes({ db }));
  router.use(buildAdminScoringConfigRoutes({ db }));
  router.use(buildAdminRaidAssignmentDataRoutes({ db }));
  router.use(buildAdminRaidAssignmentConfigRoutes({ db }));
  router.use(buildAdminRaidAssignmentImagesRoutes({ db }));
  router.use(buildAdminSiteVisibilityRoutes({ db, sessionSecret }));

  return router;
}

module.exports = buildAdminRoutes;
