const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { createWriteGuard } = require('./middleware/auth');
const buildAuthRoutes = require('./routes/auth');
const buildRosterRoutes = require('./routes/roster');
const buildBankRoutes = require('./routes/bank');
const buildItemRoutes = require('./routes/items');
const buildBisRoutes = require('./routes/bis');
const buildAdminRoutes = require('./routes/admin');
const buildRaidSignupRoutes = require('./routes/raidSignups');
const buildAssignmentsRoutes = require('./routes/assignments');
const buildMutableItemsRoutes = require('./routes/mutableItems');
const buildRecruitmentPlanningRoutes = require('./routes/recruitmentPlanning');
const buildRecruitmentApplicationsRoutes = require('./routes/recruitmentApplications');
const buildWeakAuraRoutes = require('./routes/weakauras');
const buildTacticsRoutes = require('./routes/tactics');
const buildWipefestRoutes = require('./routes/wipefest');
const buildWarcraftLogsRoutes = require('./routes/warcraftlogs');

function getGitCommitSha() {
  if (process.env.GIT_COMMIT) return String(process.env.GIT_COMMIT).trim();

  const gitHeadPath = path.join(__dirname, '..', '.git', 'HEAD');
  try {
    const head = fs.readFileSync(gitHeadPath, 'utf8').trim();
    if (head.startsWith('ref: ')) {
      const refPath = path.join(__dirname, '..', '.git', head.slice(5).trim());
      return fs.readFileSync(refPath, 'utf8').trim();
    }
    return head;
  } catch (e) {
    return 'unknown';
  }
}

function buildApp({ db, sessionSecret, bnetConfig, discordService, tokenRedemptionService, configService, discordWebhookUrl }) {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '8mb' }));
  app.use(express.urlencoded({ extended: true, limit: '8mb' }));
  app.use(createWriteGuard(sessionSecret, db));

  app.get('/api/version', (req, res) => {
    try {
      console.log('[DEBUG] /api/version handler loaded from', __filename);
      return res.json({
        routeRegistered: true,
        commit: getGitCommitSha(),
        env: {
          BNET_CLIENT_ID: Boolean(process.env.BNET_CLIENT_ID),
          BNET_REDIRECT_URI: Boolean(process.env.REDIRECT_URI),
          SITE_URL: Boolean(process.env.SITE_URL || process.env.APP_URL),
          PORT: Boolean(process.env.PORT),
          API_PORT: Boolean(process.env.API_PORT)
        }
      });
    } catch (error) {
      console.error('[DEBUG] /api/version failed', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.use('/api', buildAuthRoutes({ db, sessionSecret, bnetConfig }));
  app.use('/api', buildRosterRoutes({ db, sessionSecret, bnetConfig }));
  app.use('/api', buildBankRoutes({ db, discordService }));
  app.use('/api', buildItemRoutes({ db, tokenRedemptionService }));
  app.use('/api', buildBisRoutes({ db }));
  app.use('/api', buildAssignmentsRoutes({ db }));
  app.use('/api', buildMutableItemsRoutes({ db }));
  app.use('/api', buildRecruitmentPlanningRoutes({ db }));
  app.use('/api', buildRecruitmentApplicationsRoutes({ db, sessionSecret, webhookUrl: discordWebhookUrl }));
  app.use('/api', buildWeakAuraRoutes({ db, sessionSecret }));
  app.use('/api', buildTacticsRoutes({ db, sessionSecret }));
  app.use('/api', buildWipefestRoutes({ db, sessionSecret }));
  app.use('/api', buildWarcraftLogsRoutes({ db }));
  app.use('/api', buildAdminRoutes({ db, configService, sessionSecret }));
  app.use('/api', buildRaidSignupRoutes({ db, sessionSecret }));

  const clientBuildPath = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get(/^\/(?!api).*/, (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  }

  return app;
}

module.exports = {
  buildApp
};
