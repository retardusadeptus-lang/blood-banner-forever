const fs = require('fs');
const { db, ensureDatabaseReady } = require('./config/database');
const { buildDiscordService } = require('./services/discord');
const createTokenRedemptionService = require('./services/tokenRedemption');
const createConfigService = require('./services/configService');
const { createRaidSignupCron } = require('./services/raidSignupCron');
const { createWarcraftLogsSync } = require('./services/warcraftLogsSync');
const { initDiscordBot } = require('./bot');
const appPath = require.resolve('./app');
console.log('[DEBUG] resolved app path', appPath);
console.log('[DEBUG] app.js mtime', fs.statSync(appPath).mtime);
const { buildApp } = require(appPath);
const { BNET_CONFIG, SITE_URL, DISCORD_WEBHOOK_URL, SESSION_SECRET, API_PORT } = require('./config');
console.log('[DEBUG] SERVER SESSION_SECRET defined?', !!SESSION_SECRET, 'length=', SESSION_SECRET?.length);
console.log('[DEBUG] SERVER ADMIN_API_TOKEN defined?', Boolean(BNET_CONFIG.ADMIN_API_TOKEN));

ensureDatabaseReady();

const discordService = buildDiscordService({ siteUrl: SITE_URL, webhookUrl: DISCORD_WEBHOOK_URL });
const tokenRedemptionService = createTokenRedemptionService(db);
const configService = createConfigService(db);
const signupCron = createRaidSignupCron({ db });
const { fetchReportsFromWcl } = require('./routes/warcraftlogs');
const warcraftLogsSync = createWarcraftLogsSync({
  fetchReportsFromWcl: async () => fetchReportsFromWcl({ db })
});
const app = buildApp({
  db,
  sessionSecret: SESSION_SECRET,
  bnetConfig: BNET_CONFIG,
  discordService,
  tokenRedemptionService,
  configService,
  discordWebhookUrl: DISCORD_WEBHOOK_URL
});

initDiscordBot({ db });

setTimeout(() => {
  signupCron.run().catch(() => {});
}, 15000);

setInterval(() => {
  signupCron.run().catch(() => {});
}, 60 * 1000);

warcraftLogsSync.scheduleAtUkNightly({ hour: 23, minute: 0 });

app.listen(API_PORT, () => console.log(`Guild Loot API running on port ${API_PORT}`));
