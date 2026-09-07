const path = require('path');
const crypto = require('crypto');

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const BNET_CLIENT_ID = String(process.env.BNET_CLIENT_ID || '').trim();
const BNET_CLIENT_SECRET = String(process.env.BNET_CLIENT_SECRET || '').trim();
const BNET_REGION = String(process.env.BNET_REGION || 'eu').trim().toLowerCase();
const BNET_REDIRECT_URI = String(process.env.REDIRECT_URI || '').trim();
const BNET_LOCALE = String(process.env.BNET_LOCALE || 'en_US').trim();
const ADMIN_API_TOKEN = String(process.env.ADMIN_API_TOKEN || '').trim();
const SITE_URL = String(process.env.SITE_URL || process.env.APP_URL || '').trim();
const DISCORD_WEBHOOK_URL = String(process.env.DISCORD_WEBHOOK_URL || '').trim();
const WARCRAFTLOGS_GUILD_ID = String(process.env.WARCRAFTLOGS_GUILD_ID || process.env.WCL_GUILD_ID || '').trim();
const WARCRAFTLOGS_API_KEY = String(process.env.WARCRAFTLOGS_API_KEY || process.env.WCL_API_KEY || '').trim();
const WARCRAFTLOGS_API_BASE_URL = String(process.env.WARCRAFTLOGS_API_BASE_URL || process.env.WCL_API_BASE_URL || 'https://classic.warcraftlogs.com/api/v2/client').trim();
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const API_PORT = process.env.API_PORT || process.env.PORT || 4000;

if (!ADMIN_API_TOKEN) {
  console.warn('ADMIN_API_TOKEN is not set; officer login will not work until this environment variable is configured.');
}

const BNET_AUTHORIZE_URL = `https://${BNET_REGION}.battle.net/oauth/authorize`;
const BNET_TOKEN_URL = `https://${BNET_REGION}.battle.net/oauth/token`;
const BNET_USERINFO_URL = `https://${BNET_REGION}.battle.net/oauth/userinfo`;
const BNET_API_BASE_URL = `https://${BNET_REGION}.api.blizzard.com`;

const BNET_CONFIG = {
  BNET_CLIENT_ID,
  BNET_CLIENT_SECRET,
  BNET_REDIRECT_URI,
  BNET_AUTHORIZE_URL,
  BNET_TOKEN_URL,
  BNET_USERINFO_URL,
  BNET_API_BASE_URL,
  BNET_LOCALE,
  BNET_REGION,
  SITE_URL,
  ADMIN_API_TOKEN
};

module.exports = {
  BNET_CONFIG,
  SITE_URL,
  DISCORD_WEBHOOK_URL,
  WARCRAFTLOGS_GUILD_ID,
  WARCRAFTLOGS_API_KEY,
  WARCRAFTLOGS_API_BASE_URL,
  SESSION_SECRET,
  API_PORT
};
