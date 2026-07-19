require('dotenv').config();

const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path'); // Added for deployment pathway flexibility
const { EmbedBuilder } = require('discord.js');
const { initDiscordBot, getDiscordClient } = require('./bot');
const {
  listTemplates,
  listOpenEvents,
  listPublicActiveEvents,
  createEventFromTemplate,
  getAvailableClassesForEvent,
  getAllowedSpecsByClass,
  getEventById,
  listEntriesForEvent,
  listGroupsForEvent,
  formatSignupSummary
} = require('./discord/utils/raidSignupStore');
const { resolveRoleEmojiToken, resolveClassEmojiToken } = require('./discord/utils/discordEmojiTokens');

function withEmoji(icon, label) {
  return icon ? `${icon} ${label}` : label;
}

function parseRaidSignupDateTime(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?(?:\s*CET)?$/i);
  if (ymd) {
    const [, yyyy, mm, dd, hh = '20', min = '00'] = ymd;
    const parsed = Date.parse(`${yyyy}-${mm}-${dd}T${hh}:${min}:00+01:00`);
    return Number.isNaN(parsed) ? null : new Date(parsed);
  }

  const dmy = raw.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?(?:\s*CET)?$/i);
  if (dmy) {
    const [, dd, mm, yyyy, hh = '20', min = '00'] = dmy;
    const parsed = Date.parse(`${yyyy}-${mm}-${dd}T${hh}:${min}:00+01:00`);
    return Number.isNaN(parsed) ? null : new Date(parsed);
  }

  const loose = Date.parse(raw.replace(' ', 'T'));
  return Number.isNaN(loose) ? null : new Date(loose);
}

function formatRaidSignupDateTime(dateObj) {
  const date = new Date(dateObj.getTime() + (60 * 60 * 1000));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute} CET`;
}

function getNextRecurrenceStart(previousStart, recurrenceDays) {
  const selectedDays = [...new Set((recurrenceDays || []).map(v => Number(v)).filter(v => Number.isInteger(v) && v >= 0 && v <= 6))];
  if (selectedDays.length === 0) return null;

  for (let offset = 1; offset <= 14; offset += 1) {
    const candidate = new Date(previousStart.getTime());
    candidate.setUTCDate(candidate.getUTCDate() + offset);
    if (!selectedDays.includes(candidate.getUTCDay())) continue;
    return candidate;
  }

  return null;
}

let recurrenceTickInFlight = false;

async function autoPostRecurringSignupEvents() {
  if (recurrenceTickInFlight) return;
  recurrenceTickInFlight = true;

  try {
    const templates = listTemplates(db).filter(template => template.is_active && template.recurrence_enabled && Array.isArray(template.recurrence_days) && template.recurrence_days.length > 0);
    if (templates.length === 0) return;

    const client = getDiscordClient();
    if (!client) return;

    const { buildSignupEmbed, buildMainSignupComponents } = require('./discord/interactions/raidSignupInteractions');
    const now = Date.now();

    for (const template of templates) {
      const templateEvents = db.prepare(`
        SELECT id, template_id, title, description, scheduled_for, recurrence_instance, status, discord_channel_id, discord_message_id, created_at
        FROM raid_signup_events
        WHERE template_id = ?
        ORDER BY id DESC
      `).all(template.id);

      const parsedCandidates = templateEvents
        .map(event => ({ event, startedAt: parseRaidSignupDateTime(event.scheduled_for) }))
        .filter(row => row.startedAt && row.event.discord_channel_id)
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

      const startedCandidates = parsedCandidates.filter(row => row.startedAt.getTime() <= now);
      if (startedCandidates.length === 0) continue;

      const latest = startedCandidates[0];
      const delayMs = Math.max(0, Number(template.recurrence_delay_hours || 0)) * 60 * 60 * 1000;
      if (now < latest.startedAt.getTime() + delayMs) continue;

      const nextStart = getNextRecurrenceStart(latest.startedAt, template.recurrence_days);
      if (!nextStart) continue;

      const recurrenceInstance = nextStart.toISOString();
      const alreadyExists = templateEvents.some(event => String(event.recurrence_instance || '') === recurrenceInstance);
      if (alreadyExists) {
        console.log(`[RaidSignup] Recurrence skip for template #${template.id}: recurrence instance already exists (${recurrenceInstance}).`);
        continue;
      }

      const scheduledFor = formatRaidSignupDateTime(nextStart);
      const nextEvent = createEventFromTemplate(db, template.id, {
        title: String(template.name || latest.event.title || 'Raid Signup').trim(),
        description: String(template.description || latest.event.description || '').trim(),
        scheduledFor,
        recurrenceInstance
      });

      const channel = await client.channels.fetch(latest.event.discord_channel_id).catch(() => null);
      if (!channel || typeof channel.send !== 'function') {
        continue;
      }

      const classes = getAvailableClassesForEvent(db, nextEvent.id);
      const selectedClass = classes[0] || '';
      const specs = selectedClass ? getAllowedSpecsByClass(db, nextEvent.id, selectedClass) : [];
      const message = await channel.send({
        embeds: [buildSignupEmbed(nextEvent, [], channel.guild || null)],
        components: buildMainSignupComponents(nextEvent.id, classes, specs, selectedClass, false)
      });

      db.prepare(`
        UPDATE raid_signup_events
        SET discord_channel_id = ?, discord_message_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(String(channel.id), String(message.id), nextEvent.id);

      console.log(`[RaidSignup] Auto-posted recurring event #${nextEvent.id} from template #${template.id}`);
    }
  } catch (e) {
    console.error('[RaidSignup] Recurrence automation failed:', e.message || e);
  } finally {
    recurrenceTickInFlight = false;
  }
}

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN || 'TBCOfficer2026!';
const HARD_CODED_DB_PATH = 'C:/Users/Steve/Projects/wow-loot-dashboard/guild-loot-api/mydb.db';
const LOCAL_DB_PATH = path.join(__dirname, 'mydb.db');
const DB_PATH_CANDIDATES = [
  process.env.GUILD_LOOT_DB_PATH,
  LOCAL_DB_PATH,
  HARD_CODED_DB_PATH
].filter(Boolean);
const DB_PATH = DB_PATH_CANDIDATES.find(candidate => fs.existsSync(candidate)) || LOCAL_DB_PATH;

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
initDiscordBot({ db });

// Server-only signing secret. Set SESSION_SECRET in prod so sessions survive
// restarts; otherwise it's random per boot (everyone re-logs-in on restart).
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

function safeEqual(a, b) {
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// Stateless signed token: "<expiry>.<hmac>" â€” no DB needed.
function issueSession() {
  const payload = String(Date.now() + SESSION_TTL_MS);
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifySession(token) {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  if (!safeEqual(sig, expected)) return false;
  return Date.now() < Number(payload);
}

function generateRequestGroupId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `grp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// Exchange the admin password for a session token. The password is verified
// here and never leaves the server. Registered before the write guard below so
// the guard doesn't reject this POST.
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (!password || !safeEqual(password, ADMIN_API_TOKEN)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  res.json({ token: issueSession() });
});

app.use((req, res, next) => {
  const isWriteMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  if (!isWriteMethod) return next();

  // Public endpoint: players can submit bank requests without officer auth.
  if (req.method === 'POST' && /\/bank-requests$/.test(req.path)) {
    return next();
  }

  const token = req.get('x-admin-token') || req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!verifySession(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
});

const TIER_TOKEN_SEED_ROWS = [
  // Tier 4: Fallen
  { name: 'Helm of the Fallen Champion', phase: 'T4', zone: 'Karazhan', boss: 'Prince Malchezaar', tokenGroup: 'Fallen Champion', tokenSlot: 'head', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Gauntlets of the Fallen Champion', phase: 'T4', zone: 'Karazhan', boss: 'The Curator', tokenGroup: 'Fallen Champion', tokenSlot: 'hands', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Pauldrons of the Fallen Champion', phase: 'T4', zone: "Gruul's Lair", boss: 'High King Maulgar', tokenGroup: 'Fallen Champion', tokenSlot: 'shoulders', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Leggings of the Fallen Champion', phase: 'T4', zone: "Gruul's Lair", boss: 'Gruul the Dragonkiller', tokenGroup: 'Fallen Champion', tokenSlot: 'legs', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Chestguard of the Fallen Champion', phase: 'T4', zone: "Magtheridon's Lair", boss: 'Magtheridon', tokenGroup: 'Fallen Champion', tokenSlot: 'chest', classes: ['Paladin', 'Rogue', 'Shaman'] },

  { name: 'Helm of the Fallen Defender', phase: 'T4', zone: 'Karazhan', boss: 'Prince Malchezaar', tokenGroup: 'Fallen Defender', tokenSlot: 'head', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Gauntlets of the Fallen Defender', phase: 'T4', zone: 'Karazhan', boss: 'The Curator', tokenGroup: 'Fallen Defender', tokenSlot: 'hands', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Pauldrons of the Fallen Defender', phase: 'T4', zone: "Gruul's Lair", boss: 'High King Maulgar', tokenGroup: 'Fallen Defender', tokenSlot: 'shoulders', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Leggings of the Fallen Defender', phase: 'T4', zone: "Gruul's Lair", boss: 'Gruul the Dragonkiller', tokenGroup: 'Fallen Defender', tokenSlot: 'legs', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Chestguard of the Fallen Defender', phase: 'T4', zone: "Magtheridon's Lair", boss: 'Magtheridon', tokenGroup: 'Fallen Defender', tokenSlot: 'chest', classes: ['Druid', 'Priest', 'Warrior'] },

  { name: 'Helm of the Fallen Hero', phase: 'T4', zone: 'Karazhan', boss: 'Prince Malchezaar', tokenGroup: 'Fallen Hero', tokenSlot: 'head', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Gauntlets of the Fallen Hero', phase: 'T4', zone: 'Karazhan', boss: 'The Curator', tokenGroup: 'Fallen Hero', tokenSlot: 'hands', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Pauldrons of the Fallen Hero', phase: 'T4', zone: "Gruul's Lair", boss: 'High King Maulgar', tokenGroup: 'Fallen Hero', tokenSlot: 'shoulders', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Leggings of the Fallen Hero', phase: 'T4', zone: "Gruul's Lair", boss: 'Gruul the Dragonkiller', tokenGroup: 'Fallen Hero', tokenSlot: 'legs', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Chestguard of the Fallen Hero', phase: 'T4', zone: "Magtheridon's Lair", boss: 'Magtheridon', tokenGroup: 'Fallen Hero', tokenSlot: 'chest', classes: ['Hunter', 'Mage', 'Warlock'] },

  // Tier 5: Vanquished
  { name: 'Helm of the Vanquished Champion', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Lady Vashj', tokenGroup: 'Vanquished Champion', tokenSlot: 'head', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Gloves of the Vanquished Champion', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Leotheras the Blind', tokenGroup: 'Vanquished Champion', tokenSlot: 'hands', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Leggings of the Vanquished Champion', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Fathom-Lord Karathress', tokenGroup: 'Vanquished Champion', tokenSlot: 'legs', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Pauldrons of the Vanquished Champion', phase: 'T5', zone: 'Tempest Keep: The Eye', boss: 'Void Reaver', tokenGroup: 'Vanquished Champion', tokenSlot: 'shoulders', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Chestguard of the Vanquished Champion', phase: 'T5', zone: 'Tempest Keep: The Eye', boss: "Kael'thas Sunstrider", tokenGroup: 'Vanquished Champion', tokenSlot: 'chest', classes: ['Paladin', 'Rogue', 'Shaman'] },

  { name: 'Helm of the Vanquished Defender', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Lady Vashj', tokenGroup: 'Vanquished Defender', tokenSlot: 'head', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Gloves of the Vanquished Defender', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Leotheras the Blind', tokenGroup: 'Vanquished Defender', tokenSlot: 'hands', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Leggings of the Vanquished Defender', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Fathom-Lord Karathress', tokenGroup: 'Vanquished Defender', tokenSlot: 'legs', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Pauldrons of the Vanquished Defender', phase: 'T5', zone: 'Tempest Keep: The Eye', boss: 'Void Reaver', tokenGroup: 'Vanquished Defender', tokenSlot: 'shoulders', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Chestguard of the Vanquished Defender', phase: 'T5', zone: 'Tempest Keep: The Eye', boss: "Kael'thas Sunstrider", tokenGroup: 'Vanquished Defender', tokenSlot: 'chest', classes: ['Druid', 'Priest', 'Warrior'] },

  { name: 'Helm of the Vanquished Hero', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Lady Vashj', tokenGroup: 'Vanquished Hero', tokenSlot: 'head', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Gloves of the Vanquished Hero', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Leotheras the Blind', tokenGroup: 'Vanquished Hero', tokenSlot: 'hands', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Leggings of the Vanquished Hero', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Fathom-Lord Karathress', tokenGroup: 'Vanquished Hero', tokenSlot: 'legs', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Pauldrons of the Vanquished Hero', phase: 'T5', zone: 'Tempest Keep: The Eye', boss: 'Void Reaver', tokenGroup: 'Vanquished Hero', tokenSlot: 'shoulders', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Chestguard of the Vanquished Hero', phase: 'T5', zone: 'Tempest Keep: The Eye', boss: "Kael'thas Sunstrider", tokenGroup: 'Vanquished Hero', tokenSlot: 'chest', classes: ['Hunter', 'Mage', 'Warlock'] },

  // Tier 6: Forgotten core set
  { name: 'Gloves of the Forgotten Conqueror', phase: 'T6', zone: 'Hyjal Summit', boss: 'Azgalor', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'hands', classes: ['Paladin', 'Priest', 'Warlock'] },
  { name: 'Helm of the Forgotten Conqueror', phase: 'T6', zone: 'Hyjal Summit', boss: 'Archimonde', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'head', classes: ['Paladin', 'Priest', 'Warlock'] },
  { name: 'Shoulderpads of the Forgotten Conqueror', phase: 'T6', zone: 'Black Temple', boss: 'Mother Shahraz', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'shoulders', classes: ['Paladin', 'Priest', 'Warlock'] },
  { name: 'Leggings of the Forgotten Conqueror', phase: 'T6', zone: 'Black Temple', boss: 'Illidari Council', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'legs', classes: ['Paladin', 'Priest', 'Warlock'] },
  { name: 'Chestguard of the Forgotten Conqueror', phase: 'T6', zone: 'Black Temple', boss: 'Illidan Stormrage', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'chest', classes: ['Paladin', 'Priest', 'Warlock'] },

  { name: 'Gloves of the Forgotten Protector', phase: 'T6', zone: 'Hyjal Summit', boss: 'Azgalor', tokenGroup: 'Forgotten Protector', tokenSlot: 'hands', classes: ['Hunter', 'Shaman', 'Warrior'] },
  { name: 'Helm of the Forgotten Protector', phase: 'T6', zone: 'Hyjal Summit', boss: 'Archimonde', tokenGroup: 'Forgotten Protector', tokenSlot: 'head', classes: ['Hunter', 'Shaman', 'Warrior'] },
  { name: 'Shoulderpads of the Forgotten Protector', phase: 'T6', zone: 'Black Temple', boss: 'Mother Shahraz', tokenGroup: 'Forgotten Protector', tokenSlot: 'shoulders', classes: ['Hunter', 'Shaman', 'Warrior'] },
  { name: 'Leggings of the Forgotten Protector', phase: 'T6', zone: 'Black Temple', boss: 'Illidari Council', tokenGroup: 'Forgotten Protector', tokenSlot: 'legs', classes: ['Hunter', 'Shaman', 'Warrior'] },
  { name: 'Chestguard of the Forgotten Protector', phase: 'T6', zone: 'Black Temple', boss: 'Illidan Stormrage', tokenGroup: 'Forgotten Protector', tokenSlot: 'chest', classes: ['Hunter', 'Shaman', 'Warrior'] },

  { name: 'Gloves of the Forgotten Vanquisher', phase: 'T6', zone: 'Hyjal Summit', boss: 'Azgalor', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'hands', classes: ['Druid', 'Mage', 'Rogue'] },
  { name: 'Helm of the Forgotten Vanquisher', phase: 'T6', zone: 'Hyjal Summit', boss: 'Archimonde', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'head', classes: ['Druid', 'Mage', 'Rogue'] },
  { name: 'Shoulderpads of the Forgotten Vanquisher', phase: 'T6', zone: 'Black Temple', boss: 'Mother Shahraz', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'shoulders', classes: ['Druid', 'Mage', 'Rogue'] },
  { name: 'Leggings of the Forgotten Vanquisher', phase: 'T6', zone: 'Black Temple', boss: 'Illidari Council', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'legs', classes: ['Druid', 'Mage', 'Rogue'] },
  { name: 'Chestguard of the Forgotten Vanquisher', phase: 'T6', zone: 'Black Temple', boss: 'Illidan Stormrage', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'chest', classes: ['Druid', 'Mage', 'Rogue'] },

  // Tier 6: Sunwell token slots
  { name: 'Bracers of the Forgotten Conqueror', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Kalecgos / Sathrovarr', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'wrist', classes: ['Paladin', 'Priest', 'Warlock'] },
  { name: 'Belt of the Forgotten Conqueror', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Brutallus', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'waist', classes: ['Paladin', 'Priest', 'Warlock'] },
  { name: 'Boots of the Forgotten Conqueror', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Felmyst', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'feet', classes: ['Paladin', 'Priest', 'Warlock'] },

  { name: 'Bracers of the Forgotten Protector', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Kalecgos / Sathrovarr', tokenGroup: 'Forgotten Protector', tokenSlot: 'wrist', classes: ['Hunter', 'Shaman', 'Warrior'] },
  { name: 'Belt of the Forgotten Protector', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Brutallus', tokenGroup: 'Forgotten Protector', tokenSlot: 'waist', classes: ['Hunter', 'Shaman', 'Warrior'] },
  { name: 'Boots of the Forgotten Protector', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Felmyst', tokenGroup: 'Forgotten Protector', tokenSlot: 'feet', classes: ['Hunter', 'Shaman', 'Warrior'] },

  { name: 'Bracers of the Forgotten Vanquisher', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Kalecgos / Sathrovarr', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'wrist', classes: ['Druid', 'Mage', 'Rogue'] },
  { name: 'Belt of the Forgotten Vanquisher', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Brutallus', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'waist', classes: ['Druid', 'Mage', 'Rogue'] },
  { name: 'Boots of the Forgotten Vanquisher', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Felmyst', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'feet', classes: ['Druid', 'Mage', 'Rogue'] },

  // Quest-like token drops
  { name: "Magtheridon's Head", phase: 'T4', zone: "Magtheridon's Lair", boss: 'Magtheridon', tokenGroup: 'Quest Token', tokenSlot: 'quest', classes: ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'], isQuest: 1 },
  { name: 'The Verdant Sphere', phase: 'T5', zone: 'Tempest Keep: The Eye', boss: "Kael'thas Sunstrider", tokenGroup: 'Quest Token', tokenSlot: 'quest', classes: ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'], isQuest: 1 }
];

const QUEST_TOKEN_REWARDS = {
  "Magtheridon's Head": [
    { name: 'Ring of the Recalcitrant' },
    { name: "A'dal's Signet of Defense" },
    { name: 'Band of the Arcane Alchemist' },
    { name: 'Signet of the Sun King' }
  ],
  'The Verdant Sphere': [
    { name: "Telonicus's Pendant of Mayhem" },
    { name: "The Darkener's Grasp" },
    { name: "The Sun King's Talisman" },
    { name: "Lord Sanguinar's Claim" }
  ]
};

function normalizePhaseForDb(phase) {
  const value = String(phase || '').toLowerCase();
  if (value === 't4') return 't4';
  if (value === 't5') return 't5';
  if (value === 't6') return 't6';
  if (value === 'swp') return 'swp';
  return value;
}

function ensureTierTokenSupport() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS tier_token_metadata (
      token_item_id INTEGER PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
      token_group TEXT NOT NULL,
      token_slot TEXT NOT NULL,
      phase_key TEXT NOT NULL,
      classes_json TEXT NOT NULL,
      is_quest INTEGER DEFAULT 0
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS tier_token_reward_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      reward_name TEXT NOT NULL,
      reward_wowhead_id INTEGER
    )
  `).run();

  const insertItem = db.prepare(`
    INSERT INTO items (name, slot, phase, source, source_type)
    VALUES (?, ?, ?, ?, ?)
  `);
  const findItemByName = db.prepare('SELECT id FROM items WHERE lower(name) = lower(?) LIMIT 1');

  const upsertTokenMeta = db.prepare(`
    INSERT INTO tier_token_metadata (token_item_id, token_group, token_slot, phase_key, classes_json, is_quest)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(token_item_id)
    DO UPDATE SET
      token_group = excluded.token_group,
      token_slot = excluded.token_slot,
      phase_key = excluded.phase_key,
      classes_json = excluded.classes_json,
      is_quest = excluded.is_quest
  `);

  const deleteRewardsByToken = db.prepare('DELETE FROM tier_token_reward_items WHERE token_item_id = ?');
  const insertReward = db.prepare('INSERT INTO tier_token_reward_items (token_item_id, reward_name, reward_wowhead_id) VALUES (?, ?, ?)');

  const seedAll = db.transaction(() => {
    for (const token of TIER_TOKEN_SEED_ROWS) {
      let item = findItemByName.get(token.name);
      if (!item) {
        const info = insertItem.run(token.name, 'Token', token.phase, token.zone, token.boss);
        item = { id: info.lastInsertRowid };
      }

      upsertTokenMeta.run(
        item.id,
        token.tokenGroup,
        token.tokenSlot,
        normalizePhaseForDb(token.phase),
        JSON.stringify(token.classes || []),
        token.isQuest ? 1 : 0
      );

      const rewards = QUEST_TOKEN_REWARDS[token.name];
      if (rewards && rewards.length) {
        deleteRewardsByToken.run(item.id);
        rewards.forEach(reward => insertReward.run(item.id, reward.name, reward.wowhead_id || null));
      }
    }
  });

  seedAll();
}

function getTokenRedemptionByItemId(itemId) {
  const tokenMeta = db.prepare(`
    SELECT
      t.token_item_id,
      i.name as token_name,
      t.token_group,
      t.token_slot,
      t.phase_key,
      t.classes_json,
      t.is_quest
    FROM tier_token_metadata t
    JOIN items i ON i.id = t.token_item_id
    WHERE t.token_item_id = ?
  `).get(itemId);

  if (!tokenMeta) return null;

  const allowedClasses = JSON.parse(tokenMeta.classes_json || '[]').map(cls => String(cls).toLowerCase());
  let redeemableItems = [];

  if (tokenMeta.is_quest === 1) {
    const explicitRewards = db.prepare(`
      SELECT reward_name as name, reward_wowhead_id as wowhead_id
      FROM tier_token_reward_items
      WHERE token_item_id = ?
      ORDER BY reward_name
    `).all(itemId);

    redeemableItems = explicitRewards;
  } else if (allowedClasses.length > 0) {
    const classPlaceholders = allowedClasses.map(() => '?').join(',');
    redeemableItems = db.prepare(`
      SELECT DISTINCT
        i.id,
        i.name,
        i.wowhead_id
      FROM items i
      JOIN items_bis ib ON ib.item_id = i.id
      JOIN specs s ON s.id = ib.spec_id
      WHERE lower(i.slot) = ?
        AND lower(i.phase) = ?
        AND lower(s.class) IN (${classPlaceholders})
        AND (
          ib.preraid_bis = 1 OR ib.t4_bis = 1 OR ib.t5_bis = 1 OR ib.t6_bis = 1 OR ib.za_bis = 1 OR ib.swp_bis = 1 OR
          ib.preraid_opt = 1 OR ib.t4_opt = 1 OR ib.t5_opt = 1 OR ib.t6_opt = 1 OR ib.za_opt = 1 OR ib.swp_opt = 1
        )
      ORDER BY i.name
    `).all(tokenMeta.token_slot, tokenMeta.phase_key, ...allowedClasses);
  }

  return {
    tokenItemId: tokenMeta.token_item_id,
    tokenName: tokenMeta.token_name,
    tokenGroup: tokenMeta.token_group,
    tokenSlot: tokenMeta.token_slot,
    phaseKey: tokenMeta.phase_key,
    classes: JSON.parse(tokenMeta.classes_json || '[]'),
    isQuest: tokenMeta.is_quest === 1,
    redeemableItems
  };
}

ensureTierTokenSupport();

function ensureNormalizedOperationalTables() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS bis_priority_entries (
      phase TEXT NOT NULL,
      item_name TEXT NOT NULL,
      spec_name TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (phase, item_name, spec_name)
    )
  `).run();

  db.prepare('CREATE INDEX IF NOT EXISTS idx_bis_priority_entries_phase_item ON bis_priority_entries (phase, item_name)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_bis_priority_entries_phase_spec ON bis_priority_entries (phase, spec_name)').run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS scoring_config_values (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      parse_weight REAL NOT NULL DEFAULT 1,
      support_multi REAL NOT NULL DEFAULT 1.5,
      cons_bonus REAL NOT NULL DEFAULT 10,
      enchant_bonus REAL NOT NULL DEFAULT 10,
      gem_bonus REAL NOT NULL DEFAULT 10,
      att_weight REAL NOT NULL DEFAULT 0.5,
      afk_penalty REAL NOT NULL DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_assignment_config_bosses (
      boss_name TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const bisCount = db.prepare('SELECT COUNT(*) as count FROM bis_priority_entries').get().count;
  if (bisCount === 0) {
    const legacyRows = db.prepare('SELECT phase, data FROM bis_priorities').all();
    const insertEntry = db.prepare('INSERT OR REPLACE INTO bis_priority_entries (phase, item_name, spec_name, status) VALUES (?, ?, ?, ?)');
    const migrateBis = db.transaction(() => {
      legacyRows.forEach(row => {
        let parsed = {};
        try {
          parsed = JSON.parse(row.data || '{}');
        } catch (e) {
          parsed = {};
        }

        Object.entries(parsed).forEach(([itemKey, status]) => {
          const splitIndex = itemKey.lastIndexOf('|');
          if (splitIndex === -1) return;
          const itemName = itemKey.slice(0, splitIndex);
          const specName = itemKey.slice(splitIndex + 1);
          insertEntry.run(row.phase, itemName, specName, status);
        });
      });
    });
    migrateBis();
  }

  const scoringCount = db.prepare('SELECT COUNT(*) as count FROM scoring_config_values').get().count;
  if (scoringCount === 0) {
    let legacyConfig = {};
    const legacyRow = db.prepare('SELECT data FROM scoring_config WHERE id = 1').get();
    if (legacyRow) {
      try {
        legacyConfig = JSON.parse(legacyRow.data || '{}');
      } catch (e) {
        legacyConfig = {};
      }
    }

    const defaults = {
      parseWeight: legacyConfig.parseWeight ?? 1,
      supportMulti: legacyConfig.supportMulti ?? 1.5,
      consBonus: legacyConfig.consBonus ?? 10,
      enchantBonus: legacyConfig.enchantBonus ?? 10,
      gemBonus: legacyConfig.gemBonus ?? 10,
      attWeight: legacyConfig.attWeight ?? 0.5,
      afkPenalty: legacyConfig.afkPenalty ?? 5
    };

    db.prepare(`
      INSERT INTO scoring_config_values (id, parse_weight, support_multi, cons_bonus, enchant_bonus, gem_bonus, att_weight, afk_penalty)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      defaults.parseWeight,
      defaults.supportMulti,
      defaults.consBonus,
      defaults.enchantBonus,
      defaults.gemBonus,
      defaults.attWeight,
      defaults.afkPenalty
    );
  }

  const bossCount = db.prepare('SELECT COUNT(*) as count FROM raid_assignment_config_bosses').get().count;
  if (bossCount === 0) {
    const legacyRow = db.prepare('SELECT enabled_bosses FROM raid_assignment_config ORDER BY id LIMIT 1').get();
    let enabledBosses = [];
    if (legacyRow) {
      try {
        enabledBosses = JSON.parse(legacyRow.enabled_bosses || '[]');
      } catch (e) {
        enabledBosses = [];
      }
    }

    const insertBoss = db.prepare('INSERT OR REPLACE INTO raid_assignment_config_bosses (boss_name, enabled) VALUES (?, ?)');
    const migrateBosses = db.transaction(() => {
      enabledBosses.forEach(bossName => insertBoss.run(bossName, 1));
    });
    migrateBosses();
  }
}

ensureNormalizedOperationalTables();

function ensureBankRequestSchema() {
  const columns = db.prepare("PRAGMA table_info('bank_requests')").all();
  const hasGroupId = columns.some(col => col.name === 'request_group_id');
  if (!hasGroupId) {
    db.prepare('ALTER TABLE bank_requests ADD COLUMN request_group_id TEXT').run();
  }

  const hasRequesterName = columns.some(col => col.name === 'requester_name');
  if (!hasRequesterName) {
    db.prepare('ALTER TABLE bank_requests ADD COLUMN requester_name TEXT').run();
  }
}

function ensureOfficerRolesTable() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS officer_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_name TEXT UNIQUE NOT NULL,
      primary_officer_id INTEGER,
      backup_officer_ids_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

function ensureDiscordBotConfigTable() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS discord_bot_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      request_roles_json TEXT NOT NULL DEFAULT '[]',
      signup_roles_json TEXT NOT NULL DEFAULT '[]',
      bench_roles_json TEXT NOT NULL DEFAULT '[]',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const row = db.prepare('SELECT id FROM discord_bot_config WHERE id = 1').get();
  if (!row) {
    db.prepare(`
      INSERT INTO discord_bot_config (id, request_roles_json, signup_roles_json, bench_roles_json)
      VALUES (1, '[]', '[]', '[]')
    `).run();
  }
}

function ensureRaidSignupTables() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      starts_at_text TEXT DEFAULT '',
      recurrence_rule TEXT DEFAULT '',
      recurrence_days_json TEXT NOT NULL DEFAULT '[]',
      recurrence_delay_hours INTEGER NOT NULL DEFAULT 2,
      recurrence_enabled INTEGER NOT NULL DEFAULT 0,
      allowed_spec_ids_json TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER REFERENCES raid_signup_templates(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      scheduled_for TEXT,
      recurrence_instance TEXT,
      public_groups INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open',
      discord_channel_id TEXT,
      discord_message_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES raid_signup_events(id) ON DELETE CASCADE,
      discord_user_id TEXT NOT NULL,
      discord_username TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'signup',
      spec_id INTEGER REFERENCES specs(id) ON DELETE SET NULL,
      role_bucket TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, discord_user_id)
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_drafts (
      event_id INTEGER NOT NULL REFERENCES raid_signup_events(id) ON DELETE CASCADE,
      discord_user_id TEXT NOT NULL,
      spec_id INTEGER NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(event_id, discord_user_id)
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_user_prefs (
      discord_user_id TEXT PRIMARY KEY,
      spec_id INTEGER NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_event_filters (
      event_id INTEGER PRIMARY KEY REFERENCES raid_signup_events(id) ON DELETE CASCADE,
      selected_class TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES raid_signup_events(id) ON DELETE CASCADE,
      group_number INTEGER NOT NULL,
      group_name TEXT DEFAULT '',
      slot_index INTEGER NOT NULL,
      player_name TEXT NOT NULL,
      spec_id INTEGER REFERENCES specs(id) ON DELETE SET NULL,
      note TEXT DEFAULT '',
      UNIQUE(event_id, group_number, slot_index)
    )
  `).run();

  const eventColumns = db.prepare("PRAGMA table_info('raid_signup_events')").all();
  if (!eventColumns.some(col => col.name === 'public_groups')) {
    db.prepare('ALTER TABLE raid_signup_events ADD COLUMN public_groups INTEGER NOT NULL DEFAULT 0').run();
  }

  const groupColumns = db.prepare("PRAGMA table_info('raid_signup_groups')").all();
  if (!groupColumns.some(col => col.name === 'group_name')) {
    db.prepare('ALTER TABLE raid_signup_groups ADD COLUMN group_name TEXT DEFAULT \"\"').run();
  }

  const templateColumns = db.prepare("PRAGMA table_info('raid_signup_templates')").all();
  if (!templateColumns.some(col => col.name === 'recurrence_days_json')) {
    db.prepare("ALTER TABLE raid_signup_templates ADD COLUMN recurrence_days_json TEXT NOT NULL DEFAULT '[]'").run();
  }
  if (!templateColumns.some(col => col.name === 'recurrence_delay_hours')) {
    db.prepare('ALTER TABLE raid_signup_templates ADD COLUMN recurrence_delay_hours INTEGER NOT NULL DEFAULT 2').run();
  }
  if (!templateColumns.some(col => col.name === 'recurrence_enabled')) {
    db.prepare('ALTER TABLE raid_signup_templates ADD COLUMN recurrence_enabled INTEGER NOT NULL DEFAULT 0').run();
  }
}

function normalizeRoleList(value) {
  if (!Array.isArray(value)) return [];
  const unique = new Set();
  const out = [];

  value.forEach(entry => {
    const role = String(entry || '').trim();
    if (!role) return;
    const lowered = role.toLowerCase();
    if (unique.has(lowered)) return;
    unique.add(lowered);
    out.push(role);
  });

  return out.slice(0, 50);
}

function getDiscordBotConfigRow() {
  const row = db.prepare(`
    SELECT request_roles_json, signup_roles_json, bench_roles_json
    FROM discord_bot_config
    WHERE id = 1
  `).get();

  if (!row) {
    return {
      request_roles: [],
      signup_roles: [],
      bench_roles: []
    };
  }

  const parse = (raw) => {
    try {
      const parsed = JSON.parse(raw || '[]');
      return normalizeRoleList(parsed);
    } catch (e) {
      return [];
    }
  };

  return {
    request_roles: parse(row.request_roles_json),
    signup_roles: parse(row.signup_roles_json),
    bench_roles: parse(row.bench_roles_json)
  };
}

ensureBankRequestSchema();
ensureOfficerRolesTable();
ensureDiscordBotConfigTable();
ensureRaidSignupTables();

function ensureDatabaseIndexes() {
  const statements = [
    'CREATE INDEX IF NOT EXISTS idx_assignments_phase_item ON assignments (phase, item_name)',
    'CREATE INDEX IF NOT EXISTS idx_assignments_phase_player ON assignments (phase, player_id)',
    'CREATE INDEX IF NOT EXISTS idx_player_parses_player_boss ON player_parses (player_id, boss_name)',
    'CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_stats (player_id)',
    'CREATE INDEX IF NOT EXISTS idx_raid_logs_date ON raid_logs (raid_date)',
    'CREATE INDEX IF NOT EXISTS idx_roster_spec_id ON roster (spec_id)',
    'CREATE INDEX IF NOT EXISTS idx_items_name ON items (name)',
    'CREATE INDEX IF NOT EXISTS idx_items_slot_phase ON items (slot, phase)',
    'CREATE INDEX IF NOT EXISTS idx_items_source ON items (source, source_type)',
    'CREATE INDEX IF NOT EXISTS idx_items_bis_item_spec ON items_bis (item_id, spec_id)',
    'CREATE INDEX IF NOT EXISTS idx_bank_items_category_name ON bank_items (category, name)',
    'CREATE INDEX IF NOT EXISTS idx_bank_requests_status_created ON bank_requests (status, created_at)',
    'CREATE INDEX IF NOT EXISTS idx_bank_requests_group_id ON bank_requests (request_group_id)',
    'CREATE INDEX IF NOT EXISTS idx_raid_assignment_images_boss_created ON raid_assignment_images (boss_name, created_at)'
  ];

  statements.forEach(sql => db.prepare(sql).run());
}

ensureDatabaseIndexes();

// ==========================================
// DISCORD WEBHOOKS
// ==========================================
const DISCORD_WEBHOOK_URL = String(process.env.DISCORD_WEBHOOK_URL || '').trim();
if (!DISCORD_WEBHOOK_URL) {
  console.warn('DISCORD_WEBHOOK_URL is not set â€” Discord notifications are disabled.');
}
const SITE_URL = process.env.SITE_URL || 'https://tbc-loot-dashboard.vercel.app/';

async function postToDiscord(payload) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      console.error(`Discord webhook returned ${response.status}: ${bodyText}`);
    }
  } catch (e) {
    console.error('Discord webhook failed:', e.message);
  }
}

async function sendBankInventoryWebhook(items) {
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));

  const getCategoryBlock = (catName) => {
    const catItems = sorted.filter(i => i.category === catName);
    if (catItems.length === 0) return 'None';
    const topItems = catItems.slice(0, 15);
    let block = topItems.map(i => `**${i.count}x** ${i.name}`).join('\n');
    if (catItems.length > 15) block += `\n*...and ${catItems.length - 15} more*`;
    return block;
  };

  await postToDiscord({
    username: 'Guild Banker',
    avatar_url: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_bag_10_green.jpg',
    embeds: [{
      title: '📦 Guild Bank Inventory Report',
      description: `[**Click here to view full inventory**](${SITE_URL})`,
      color: 3066993,
      fields: [
        { name: '🧪 Consumables', value: getCategoryBlock('Consumable'), inline: true },
        { name: '💎 Materials', value: getCategoryBlock('Materials'), inline: true },
        { name: '✔️ Gear', value: getCategoryBlock('Gear'), inline: true },
        { name: '📜 Patterns', value: getCategoryBlock('Recipe'), inline: true }
      ],
      footer: { text: 'Updated just now' },
      timestamp: new Date().toISOString()
    }]
  });
}

async function sendBankRequestWebhook({ player_name, item_name, quantity, reason }) {
  await postToDiscord({
    username: 'Guild Banker',
    avatar_url: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_bag_10_green.jpg',
    embeds: [{
      title: '📥 New Bank Request',
      color: 15844367,
      fields: [
        { name: 'Player', value: player_name, inline: true },
        { name: 'Item', value: item_name, inline: true },
        { name: 'Quantity', value: String(quantity), inline: true },
        { name: 'Reason', value: reason || '_No reason given_' }
      ],
      timestamp: new Date().toISOString()
    }]
  });
}

async function sendBankResolutionWebhook({ player_name, item_name, quantity, status, price, officer_note, approved_quantity }) {
  const isApproved = status === 'approved';
  const isPartial = isApproved && approved_quantity && approved_quantity < quantity;

  await postToDiscord({
    username: 'Guild Banker',
    avatar_url: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_bag_10_green.jpg',
    embeds: [{
      title: isApproved ? (isPartial ? '✔️ Bank Request Partially Approved' : '✅ Bank Request Approved') : '❌ Bank Request Denied',
      color: isApproved ? 3066993 : 15158332,
      fields: [
        { name: 'Player', value: player_name, inline: true },
        { name: 'Item', value: item_name, inline: true },
        { name: 'Requested', value: String(quantity), inline: true },
        ...(isApproved ? [{ name: 'Approved', value: String(approved_quantity || quantity), inline: true }] : []),
        ...(isApproved && price ? [{ name: 'Price', value: `${price}g`, inline: true }] : []),
        ...(officer_note ? [{ name: isApproved ? 'Note' : 'Reason', value: officer_note }] : [])
      ],
      timestamp: new Date().toISOString()
    }]
  });
}

async function sendBankBulkResolutionWebhook({ lines, title = '📦 Bank Basket Resolved' }) {
  await postToDiscord({
    username: 'Guild Banker',
    avatar_url: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_bag_10_green.jpg',
    embeds: [{
      title,
      color: 3447003,
      description: lines.join('\n') || 'No items in summary.',
      timestamp: new Date().toISOString()
    }]
  });
}

// ==========================================
// ROSTER
// ==========================================
app.get('/api/roster', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, name, spec_id, in_raid FROM roster').all();
    const roster = rows.map(r => ({ ...r, in_raid: r.in_raid === 1 }));
    res.json(roster);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/roster', (req, res) => {
  try {
    const players = req.body;
    const deleteAll = db.prepare('DELETE FROM roster');
    const insertWithId = db.prepare('INSERT INTO roster (id, name, spec_id, in_raid) VALUES (?, ?, ?, ?)');
    const insertNoId = db.prepare('INSERT INTO roster (name, spec_id, in_raid) VALUES (?, ?, ?)');

    const saveAll = db.transaction(() => {
      deleteAll.run();
      return players.map(p => {
        if (p.id !== undefined && p.id !== null && String(p.id).trim() !== '') {
          insertWithId.run(Number(p.id), p.name, p.spec_id, p.in_raid ? 1 : 0);
          return { id: Number(p.id), name: p.name, spec_id: p.spec_id, in_raid: !!p.in_raid };
        }

        const info = insertNoId.run(p.name, p.spec_id, p.in_raid ? 1 : 0);
        return { id: info.lastInsertRowid, name: p.name, spec_id: p.spec_id, in_raid: !!p.in_raid };
      });
    });

    const updatedRosters = saveAll();

    res.json(updatedRosters);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// ASSIGNMENTS
// ==========================================
app.get('/api/assignments/:phase', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT item_name, player_id, rank, is_pass
      FROM assignments
      WHERE phase = ?
    `).all(req.params.phase);

    const result = {};
    rows.forEach(row => {
      if (!result[row.item_name]) result[row.item_name] = {};
      result[row.item_name][row.player_id] = row.is_pass ? 'Pass' : row.rank;
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/assignments/:phase', (req, res) => {
  try {
    const phase = req.params.phase;
    const assignments = req.body;

    const upsert = db.prepare(`
      INSERT INTO assignments (phase, item_name, player_id, rank, is_pass)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(phase, item_name, player_id)
      DO UPDATE SET rank = excluded.rank, is_pass = excluded.is_pass
    `);

    const remove = db.prepare(`
      DELETE FROM assignments
      WHERE phase = ? AND item_name = ? AND player_id = ?
    `);

    const updateAll = db.transaction(() => {
      const submittedItems = Object.keys(assignments || {});

      // If no items submitted, remove all assignments for this phase
      if (submittedItems.length === 0) {
        db.prepare(`DELETE FROM assignments WHERE phase = ?`).run(phase);
        return;
      }

      // Remove any assignments for items that were not included in the submission
      const placeholders = submittedItems.map(() => '?').join(',');
      const deleteStmt = db.prepare(`DELETE FROM assignments WHERE phase = ? AND item_name NOT IN (${placeholders})`);
      deleteStmt.run(phase, ...submittedItems);

      for (const [itemName, players] of Object.entries(assignments)) {
        for (const [playerId, value] of Object.entries(players)) {
          if (value === null || value === undefined) {
            remove.run(phase, itemName, playerId);
          } else if (value === 'Pass') {
            upsert.run(phase, itemName, parseInt(playerId), null, 1);
          } else {
            upsert.run(phase, itemName, parseInt(playerId), value, 0);
          }
        }
      }
    });

    updateAll();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// BIS PRIORITIES (phase-specific)
// ==========================================
app.get('/api/bis-priorities/:phase', (req, res) => {
  try {
    const rows = db.prepare('SELECT item_name, spec_name, status FROM bis_priority_entries WHERE phase = ?').all(req.params.phase);
    const result = {};
    rows.forEach(row => {
      result[`${row.item_name}|${row.spec_name}`] = row.status;
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/bis-priorities/:phase', (req, res) => {
  try {
    const phase = req.params.phase;
    const deletePhase = db.prepare('DELETE FROM bis_priority_entries WHERE phase = ?');
    const insertEntry = db.prepare('INSERT INTO bis_priority_entries (phase, item_name, spec_name, status) VALUES (?, ?, ?, ?)');

    const updateAll = db.transaction(() => {
      deletePhase.run(phase);
      for (const [itemKey, status] of Object.entries(req.body || {})) {
        const splitIndex = itemKey.lastIndexOf('|');
        if (splitIndex === -1 || !status) continue;
        const itemName = itemKey.slice(0, splitIndex);
        const specName = itemKey.slice(splitIndex + 1);
        insertEntry.run(phase, itemName, specName, status);
      }
    });

    updateAll();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// DEFAULT BiS PRIORITIES FROM items_bis TABLE
// ==========================================
app.get('/api/bis-defaults/:phase', (req, res) => {
  try {
    const phaseMap = {
      'pre-bis': 'preraid',
      't4': 't4',
      't5': 't5',
      't6': 't6',
      'za': 'za',
      'swp': 'swp'
    };

    const phaseKey = phaseMap[req.params.phase.toLowerCase()];
    if (!phaseKey) return res.status(400).json({ error: 'Invalid phase' });

    const bisCol = `${phaseKey}_bis`;
    const optCol = `${phaseKey}_opt`;

    const rows = db.prepare(`
      SELECT i.name, s.spec,
        ib.${bisCol} as is_bis,
        ib.${optCol} as is_opt
      FROM items_bis ib
      JOIN items i ON i.id = ib.item_id
      JOIN specs s ON s.id = ib.spec_id
      WHERE ib.${bisCol} = 1 OR ib.${optCol} = 1
    `).all();

    const result = {};
    rows.forEach(row => {
      const key = `${row.name}|${row.spec}`;
      result[key] = row.is_bis ? 'BiS' : 'Opt';
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// PLAYER STATS
// ==========================================
app.get('/api/player-stats', (req, res) => {
  try {
    const stats = db.prepare('SELECT * FROM player_stats').all();
    const parses = db.prepare('SELECT * FROM player_parses').all();

    const result = {};

    stats.forEach(row => {
      result[row.player_id] = {
        cons: row.consumables === 1,
        enchants: row.enchants === 1,
        gems: row.gems === 1,
        afks: row.afks,
        manualAdjustment: {
          value: row.manual_adjustment || 0,
          note: row.manual_adjustment_note || ''
        },
        parses: {}
      };
    });

    parses.forEach(row => {
      if (!result[row.player_id]) {
        result[row.player_id] = {
          cons: false,
          enchants: false,
          gems: false,
          afks: 0,
          manualAdjustment: { value: 0, note: '' },
          parses: {}
        };
      }
      result[row.player_id].parses[row.boss_name] = {
        val: row.parse_value,
        support: row.is_support === 1
      };
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/player-stats', (req, res) => {
  try {
    const allStats = req.body;

    const upsertStats = db.prepare(`
      INSERT INTO player_stats (player_id, consumables, enchants, gems, afks, manual_adjustment, manual_adjustment_note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(player_id)
      DO UPDATE SET
        consumables = excluded.consumables,
        enchants = excluded.enchants,
        gems = excluded.gems,
        afks = excluded.afks,
        manual_adjustment = excluded.manual_adjustment,
        manual_adjustment_note = excluded.manual_adjustment_note
    `);

    const upsertParse = db.prepare(`
      INSERT INTO player_parses (player_id, boss_name, parse_value, is_support)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(player_id, boss_name)
      DO UPDATE SET parse_value = excluded.parse_value, is_support = excluded.is_support
    `);

    const updateAll = db.transaction(() => {
      for (const [playerId, stats] of Object.entries(allStats)) {
        upsertStats.run(
          parseInt(playerId),
          stats.cons ? 1 : 0,
          stats.enchants ? 1 : 0,
          stats.gems ? 1 : 0,
          stats.afks || 0,
          stats.manualAdjustment?.value || 0,
          stats.manualAdjustment?.note || ''
        );

        if (stats.parses) {
          for (const [bossName, parseData] of Object.entries(stats.parses)) {
            if (parseData && parseData.val !== undefined && parseData.val !== '') {
              upsertParse.run(
                parseInt(playerId),
                bossName,
                parseData.val,
                parseData.support ? 1 : 0
              );
            }
          }
        }
      }
    });

    updateAll();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// RAID LOGS
// ==========================================
app.get('/api/raid-logs', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM raid_logs ORDER BY raid_date DESC').all();
    const attendees = db.prepare('SELECT * FROM raid_attendees').all();

    const result = logs.map(log => ({
      id: log.id,
      date: log.raid_date,
      zone: log.zone,
      attendees: attendees
        .filter(a => a.raid_id === log.id)
        .map(a => a.player_id)
    }));

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/raid-logs', (req, res) => {
  try {
    const logs = req.body;

    const deleteAttendees = db.prepare('DELETE FROM raid_attendees WHERE raid_id = ?');
    const deleteLogs = db.prepare('DELETE FROM raid_logs WHERE id NOT IN (SELECT value FROM json_each(?))');
    const upsertLog = db.prepare(`
      INSERT INTO raid_logs (id, raid_date, zone)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET raid_date = excluded.raid_date, zone = excluded.zone
    `);
    const insertAttendee = db.prepare(`
      INSERT OR IGNORE INTO raid_attendees (raid_id, player_id) VALUES (?, ?)
    `);

    const updateAll = db.transaction(() => {
      const ids = logs.map(l => l.id);
      deleteLogs.run(JSON.stringify(ids));

      for (const log of logs) {
        upsertLog.run(log.id, log.date, log.zone);
        deleteAttendees.run(log.id);
        (log.attendees || []).forEach(playerId => {
          insertAttendee.run(log.id, playerId);
        });
      }
    });

    updateAll();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// SCORING CONFIG
// ==========================================
app.get('/api/scoring-config', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM scoring_config_values WHERE id = 1').get();
    res.json(row ? {
      parseWeight: row.parse_weight,
      supportMulti: row.support_multi,
      consBonus: row.cons_bonus,
      enchantBonus: row.enchant_bonus,
      gemBonus: row.gem_bonus,
      attWeight: row.att_weight,
      afkPenalty: row.afk_penalty
    } : {
      parseWeight: 1,
      supportMulti: 1.5,
      consBonus: 10,
      enchantBonus: 10,
      gemBonus: 10,
      attWeight: 0.5,
      afkPenalty: 5
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/scoring-config', (req, res) => {
  try {
    const payload = req.body || {};
    db.prepare(`
      INSERT INTO scoring_config_values (id, parse_weight, support_multi, cons_bonus, enchant_bonus, gem_bonus, att_weight, afk_penalty)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        parse_weight = excluded.parse_weight,
        support_multi = excluded.support_multi,
        cons_bonus = excluded.cons_bonus,
        enchant_bonus = excluded.enchant_bonus,
        gem_bonus = excluded.gem_bonus,
        att_weight = excluded.att_weight,
        afk_penalty = excluded.afk_penalty
    `).run(
      payload.parseWeight ?? 1,
      payload.supportMulti ?? 1.5,
      payload.consBonus ?? 10,
      payload.enchantBonus ?? 10,
      payload.gemBonus ?? 10,
      payload.attWeight ?? 0.5,
      payload.afkPenalty ?? 5
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// MUTABLE ITEMS
// ==========================================
app.get('/api/mutable-items', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        i.id,
        i.name,
        i.slot,
        i.phase,
        i.source as zone,
        i.source_type as boss,
        i.drop_chance,
        i.rarity,
        i.wowhead_id as itemId,
        CASE WHEN t.token_item_id IS NULL THEN 0 ELSE 1 END as is_token,
        t.token_group,
        t.token_slot,
        t.classes_json,
        t.is_quest
      FROM items i
      LEFT JOIN tier_token_metadata t ON t.token_item_id = i.id
      ORDER BY name
    `).all();
    const mapped = rows.map(row => ({
      ...row,
      is_token: row.is_token === 1,
      is_quest: row.is_quest === 1,
      token_classes: row.classes_json ? JSON.parse(row.classes_json) : []
    }));
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// TOKEN REDEMPTIONS
// ==========================================
app.get('/api/token-redemptions/:itemId', (req, res) => {
  try {
    const redemption = getTokenRedemptionByItemId(req.params.itemId);
    if (!redemption) return res.json({ isToken: false });
    res.json({ isToken: true, ...redemption });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// ITEMS INDEXING
// ==========================================
app.get('/api/items', (req, res) => {
  try {
    const { phase, spec, slot, category } = req.query;

    let sql = `
      SELECT DISTINCT
        i.id,
        i.name,
        i.slot,
        CASE WHEN t.token_item_id IS NULL THEN 0 ELSE 1 END as is_token,
        t.token_group,
        t.token_slot,
        t.classes_json,
        t.is_quest,
        i.source,
        i.source_type,
        i.drop_chance,
        i.rarity,
        i.wowhead_id
      FROM items i
      LEFT JOIN tier_token_metadata t ON t.token_item_id = i.id
    `;

    const params = [];
    const joins = [];
    const wheres = [];

    if (phase || spec) {
      joins.push('JOIN items_bis ib ON ib.item_id = i.id');
      joins.push('JOIN specs s ON s.id = ib.spec_id');
    }

    if (phase) {
      const validPhases = ['preraid', 't4', 't5', 't6', 'za', 'swp'];
      const phaseKey = phase.toLowerCase().replace('-', '').replace('pre-bis', 'preraid');
      const safePhase = validPhases.includes(phaseKey) ? phaseKey : 't5';
      wheres.push(`(ib.${safePhase}_bis = 1 OR ib.${safePhase}_opt = 1)`);
    }

    if (spec) {
      wheres.push('s.spec = ?');
      params.push(spec);
    }

    if (slot) {
      wheres.push('i.slot = ?');
      params.push(slot);
    }

    if (category === 'token') {
      wheres.push('t.token_item_id IS NOT NULL');
    } else if (category === 'item') {
      wheres.push('t.token_item_id IS NULL');
    }

    if (joins.length) sql += ' ' + joins.join(' ');
    if (wheres.length) sql += ' WHERE ' + wheres.join(' AND ');
    sql += ' ORDER BY i.name';

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/items/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const bisRows = db.prepare(`
      SELECT
        s.spec,
        s.class,
        ib.preraid_bis, ib.t4_bis, ib.t5_bis, ib.t6_bis, ib.za_bis, ib.swp_bis,
        ib.preraid_opt, ib.t4_opt, ib.t5_opt, ib.t6_opt, ib.za_opt, ib.swp_opt
      FROM items_bis ib
      JOIN specs s ON s.id = ib.spec_id
      WHERE ib.item_id = ?
      ORDER BY s.class, s.spec
    `).all(req.params.id);

    res.json({ ...item, bis: bisRows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/items', (req, res) => {
  try {
    const { name, slot, zone, boss, itemId, drop_chance, rarity } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

    const result = db.prepare(`
      INSERT INTO items (name, slot, source, source_type, wowhead_id, drop_chance, rarity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      slot || null,
      zone || null,
      boss || null,
      itemId && String(itemId).trim() !== '' ? parseInt(itemId) : null,
      drop_chance || null,
      rarity || null
    );

    const newItem = db.prepare(`
      SELECT id, name, slot, phase, source as zone, source_type as boss, drop_chance, rarity, wowhead_id as itemId
      FROM items WHERE id = ?
    `).get(result.lastInsertRowid);

    res.json(newItem);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/items/:id', (req, res) => {
  try {
    const { itemId } = req.body;
    db.prepare('UPDATE items SET wowhead_id = ? WHERE id = ?').run(
      itemId && String(itemId).trim() !== '' ? parseInt(itemId) : null,
      req.params.id
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const deleteAll = db.transaction(() => {
      db.prepare('DELETE FROM items_bis WHERE item_id = ?').run(req.params.id);
      db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
    });
    deleteAll();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// BiS MAPPINGS
// ==========================================
app.get('/api/bis', (req, res) => {
  try {
    const { spec, phase } = req.query;
    if (!spec || !phase) return res.status(400).json({ error: 'spec and phase are required' });

    const validPhases = ['preraid', 't4', 't5', 't6', 'za', 'swp'];
    const phaseKey = phase.toLowerCase().replace('-', '').replace('pre-bis', 'preraid');
    const safePhase = validPhases.includes(phaseKey) ? phaseKey : 't5';

    const rows = db.prepare(`
      SELECT
        i.id,
        i.name,
        i.slot,
        i.source,
        i.source_type,
        i.drop_chance,
        i.rarity,
        i.wowhead_id,
        ib.${safePhase}_bis as is_bis,
        ib.${safePhase}_opt as is_opt
      FROM items i
      JOIN items_bis ib ON ib.item_id = i.id
      JOIN specs s ON s.id = ib.spec_id
      WHERE s.spec = ?
        AND (ib.${safePhase}_bis = 1 OR ib.${safePhase}_opt = 1)
      ORDER BY i.slot, i.name
    `).all(spec);

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/bis/item/:itemId', (req, res) => {
  try {
    const { phase } = req.query;
    const validPhases = ['preraid', 't4', 't5', 't6', 'za', 'swp'];
    const phaseKey = (phase || 't5').toLowerCase().replace('-', '').replace('pre-bis', 'preraid');
    const safePhase = validPhases.includes(phaseKey) ? phaseKey : 't5';

    const rows = db.prepare(`
      SELECT
        s.spec,
        s.class,
        ib.${safePhase}_bis as is_bis,
        ib.${safePhase}_opt as is_opt
      FROM items_bis ib
      JOIN specs s ON s.id = ib.spec_id
      WHERE ib.item_id = ?
        AND (ib.${safePhase}_bis = 1 OR ib.${safePhase}_opt = 1)
      ORDER BY s.class, s.spec
    `).all(req.params.itemId);

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// SPECS
// ==========================================
app.get('/api/specs', (req, res) => {
  try {
    const { class: className } = req.query;
    if (className) {
      const rows = db.prepare('SELECT * FROM specs WHERE class = ? ORDER BY spec').all(className);
      res.json(rows);
    } else {
      const rows = db.prepare('SELECT * FROM specs ORDER BY class, spec').all();
      res.json(rows);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// BANK ITEMS
// ==========================================
app.get('/api/bank-items', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM bank_items ORDER BY category, name').all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/bank-items', async (req, res) => {
  try {
    const items = req.body;

    db.prepare('DELETE FROM bank_items').run();
    const insert = db.prepare(`
      INSERT INTO bank_items (item_wowhead_id, name, category, count, sub_type)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertAll = db.transaction(() => {
      items.forEach(item => {
        insert.run(item.item_wowhead_id, item.name, item.category, item.count, item.sub_type || '');
      });
    });
    insertAll();

    db.prepare('INSERT INTO bank_uploads (item_count) VALUES (?)').run(items.length);

    await sendBankInventoryWebhook(items);
    res.json({ ok: true, count: items.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// BANK REQUESTS
// ==========================================
app.get('/api/bank-requests', (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM bank_requests';
    const params = [];
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bank-requests', async (req, res) => {
  try {
    const { player_id, item_wowhead_id, item_name, quantity, reason, basket_items, request_group_id } = req.body;

    const insert = db.prepare(`
      INSERT INTO bank_requests (player_id, item_wowhead_id, item_name, quantity, reason, status, request_group_id, requester_name)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `);

    if (Array.isArray(basket_items) && basket_items.length > 0) {
      const groupId = request_group_id || generateRequestGroupId();
      const createdIds = [];

      const insertAll = db.transaction(() => {
        basket_items.forEach(item => {
          const info = insert.run(
            item.player_id,
            item.item_wowhead_id || 0,
            item.item_name,
            item.quantity || 1,
            item.reason || '',
            groupId,
            item.player_name || null
          );
          createdIds.push(info.lastInsertRowid);
        });
      });

      insertAll();
      return res.json({ ok: true, group_id: groupId, ids: createdIds, count: createdIds.length });
    }

    const result = insert.run(
      player_id,
      item_wowhead_id || 0,
      item_name,
      quantity || 1,
      reason || '',
      request_group_id || null,
      null
    );

    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/bank-requests/bulk-resolve', async (req, res) => {
  try {
    const resolutions = Array.isArray(req.body?.resolutions) ? req.body.resolutions : [];
    if (resolutions.length === 0) return res.status(400).json({ error: 'No resolutions provided' });

    const update = db.prepare(`
      UPDATE bank_requests
      SET status = ?, price = ?, officer_note = ?, approved_quantity = ?, resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const getRequest = db.prepare('SELECT * FROM bank_requests WHERE id = ?');
    const getPlayer = db.prepare('SELECT name FROM roster WHERE id = ?');

    const summaryLines = [];

    const applyAll = db.transaction(() => {
      resolutions.forEach(r => {
        update.run(r.status, r.price || null, r.note || '', r.quantity || null, r.id);
        const request = getRequest.get(r.id);
        if (!request) return;
        const player = getPlayer.get(request.player_id);
        const playerName = player?.name || request.requester_name || 'Unknown';

        if (r.status === 'approved') {
          const isPartial = Number(r.quantity || request.quantity) < Number(request.quantity);
          const icon = isPartial ? '⚠️' : '✅';
          const qty = isPartial ? `${r.quantity || request.quantity}/${request.quantity}` : `${r.quantity || request.quantity}`;
          const priceText = r.price ? ` — ${r.price}g` : '';
          const noteText = r.note ? ` (${r.note})` : '';
          summaryLines.push(`${icon} **${request.item_name}** x${qty} for **${playerName}**${priceText}${noteText}`);
        } else {
          summaryLines.push(`❌ **${request.item_name}** for **${playerName}** — Denied${r.note ? `: ${r.note}` : ''}`);
        }
      });
    });

    applyAll();

    if (summaryLines.length > 0) {
      await sendBankBulkResolutionWebhook({ lines: summaryLines });
    }

    res.json({ ok: true, count: resolutions.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/bank-requests/:id', async (req, res) => {
  try {
    const { status, price, officer_note, approved_quantity } = req.body;
    const requestId = req.params.id;

    const getRequest = db.prepare('SELECT * FROM bank_requests WHERE id = ?');
    const getPlayer = db.prepare('SELECT name FROM roster WHERE id = ?');

    db.prepare(`
      UPDATE bank_requests
      SET status = ?, price = ?, officer_note = ?, approved_quantity = ?, resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, price || null, officer_note || '', approved_quantity || null, requestId);

    const request = getRequest.get(requestId);
    if (request) {
      const player = getPlayer.get(request.player_id);
      const playerName = player?.name || request.requester_name || 'Unknown';
      await sendBankResolutionWebhook({
        player_name: playerName,
        item_name: request.item_name,
        quantity: request.quantity,
        status,
        price,
        officer_note,
        approved_quantity
      });
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// RAID ASSIGNMENTS
// ==========================================

// Whole-document blob: { [bossName]: { tanks, healers, hunterMDs, curses, soulstones, judgements, notes } }
app.get('/api/raid-assignment-data', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM raid_assignment_data ORDER BY id LIMIT 1').get();
    res.json(row ? JSON.parse(row.data) : {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/raid-assignment-data', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM raid_assignment_data ORDER BY id LIMIT 1').get();
    if (existing) {
      db.prepare('UPDATE raid_assignment_data SET data = ? WHERE id = ?').run(JSON.stringify(req.body), existing.id);
    } else {
      db.prepare('INSERT INTO raid_assignment_data (data) VALUES (?)').run(JSON.stringify(req.body));
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Which bosses currently have a visible assignment card: array of boss name strings
app.get('/api/raid-assignment-config', (req, res) => {
  try {
    const rows = db.prepare('SELECT boss_name FROM raid_assignment_config_bosses WHERE enabled = 1 ORDER BY boss_name').all();
    res.json(rows.map(row => row.boss_name));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/raid-assignment-config', (req, res) => {
  try {
    const enabledBosses = Array.isArray(req.body) ? req.body : [];
    const deleteAll = db.prepare('DELETE FROM raid_assignment_config_bosses');
    const insertBoss = db.prepare('INSERT INTO raid_assignment_config_bosses (boss_name, enabled) VALUES (?, 1)');

    const updateAll = db.transaction(() => {
      deleteAll.run();
      enabledBosses.forEach(bossName => insertBoss.run(bossName));
    });

    updateAll();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// OFFICER ROLES
// ==========================================
app.get('/api/officer-roles', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, role_name, primary_officer_id, backup_officer_ids_json FROM officer_roles ORDER BY role_name').all();
    const mapped = rows.map(row => ({
      id: row.id,
      role_name: row.role_name,
      primary_officer_id: row.primary_officer_id,
      backup_officer_ids: JSON.parse(row.backup_officer_ids_json || '[]')
    }));
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/officer-roles', (req, res) => {
  try {
    const roles = Array.isArray(req.body) ? req.body : [];
    const deleteAll = db.prepare('DELETE FROM officer_roles');
    const insertRole = db.prepare(`
      INSERT INTO officer_roles (role_name, primary_officer_id, backup_officer_ids_json)
      VALUES (?, ?, ?)
    `);

    const saveAll = db.transaction(() => {
      deleteAll.run();
      roles.forEach(role => {
        if (!role?.role_name) return;
        insertRole.run(
          String(role.role_name).trim(),
          role.primary_officer_id || null,
          JSON.stringify(Array.isArray(role.backup_officer_ids) ? role.backup_officer_ids : [])
        );
      });
    });

    saveAll();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// DISCORD BOT CONFIG
// ==========================================
app.get('/api/discord-bot-config', (req, res) => {
  try {
    res.json(getDiscordBotConfigRow());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/discord-bot-config', (req, res) => {
  try {
    const requestRoles = normalizeRoleList(req.body?.request_roles);
    const signupRoles = normalizeRoleList(req.body?.signup_roles);
    const benchRoles = normalizeRoleList(req.body?.bench_roles);

    db.prepare(`
      UPDATE discord_bot_config
      SET request_roles_json = ?, signup_roles_json = ?, bench_roles_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      JSON.stringify(requestRoles),
      JSON.stringify(signupRoles),
      JSON.stringify(benchRoles)
    );

    res.json({
      ok: true,
      request_roles: requestRoles,
      signup_roles: signupRoles,
      bench_roles: benchRoles
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// RAID SIGNUP TEMPLATES / EVENTS
// ==========================================
app.get('/api/raid-signup-templates', (req, res) => {
  try {
    res.json(listTemplates(db));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/raid-signup-templates', (req, res) => {
  try {
    const templates = Array.isArray(req.body) ? req.body : [];
    const deleteAll = db.prepare('DELETE FROM raid_signup_templates');
    const insertTemplate = db.prepare(`
      INSERT INTO raid_signup_templates (name, description, starts_at_text, recurrence_rule, recurrence_days_json, recurrence_delay_hours, recurrence_enabled, allowed_spec_ids_json, is_active, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const saveAll = db.transaction(() => {
      deleteAll.run();
      templates.forEach(template => {
        const name = String(template?.name || '').trim();
        if (!name) return;
        const allowed = Array.isArray(template.allowed_spec_ids)
          ? template.allowed_spec_ids.map(v => Number(v)).filter(Boolean)
          : [];
        const recurrenceDays = Array.isArray(template.recurrence_days)
          ? [...new Set(template.recurrence_days.map(v => Number(v)).filter(v => Number.isInteger(v) && v >= 0 && v <= 6))].sort((a, b) => a - b)
          : [];
        const parsedDelayHours = Number(template.recurrence_delay_hours);
        const recurrenceDelayHours = Number.isFinite(parsedDelayHours) ? Math.max(0, parsedDelayHours) : 2;
        insertTemplate.run(
          name,
          String(template.description || '').trim(),
          String(template.starts_at_text || '').trim(),
          String(template.recurrence_rule || '').trim(),
          JSON.stringify(recurrenceDays),
          recurrenceDelayHours,
          template.recurrence_enabled === true ? 1 : 0,
          JSON.stringify(allowed),
          template.is_active === false ? 0 : 1
        );
      });
    });

    saveAll();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/raid-signup-events', (req, res) => {
  try {
    const status = String(req.query.status || '').trim().toLowerCase();
    let rows;
    if (status) {
      rows = db.prepare(`
        SELECT id, template_id, title, description, scheduled_for, recurrence_instance, public_groups, status, discord_channel_id, discord_message_id, created_at
        FROM raid_signup_events
        WHERE lower(status) = ?
        ORDER BY id DESC
      `).all(status);
    } else {
      rows = db.prepare(`
        SELECT id, template_id, title, description, scheduled_for, recurrence_instance, public_groups, status, discord_channel_id, discord_message_id, created_at
        FROM raid_signup_events
        ORDER BY id DESC
      `).all();
    }
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/raid-signup-events/:id', (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const event = getEventById(db, eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const entries = listEntriesForEvent(db, eventId);
    const groups = listGroupsForEvent(db, eventId);
    res.json({ ...event, entries, groups });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/raid-signup-events/:id', (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const event = getEventById(db, eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const title = req.body?.title;
    const description = req.body?.description;
    const scheduledFor = req.body?.scheduled_for;
    const publicGroups = req.body?.public_groups;

    db.prepare(`
      UPDATE raid_signup_events
      SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        scheduled_for = COALESCE(?, scheduled_for),
        public_groups = COALESCE(?, public_groups),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title !== undefined ? String(title || '').trim() : null,
      description !== undefined ? String(description || '').trim() : null,
      scheduledFor !== undefined ? String(scheduledFor || '').trim() : null,
      publicGroups !== undefined ? (publicGroups ? 1 : 0) : null,
      eventId
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/raid-signup-events/:id/status', async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const event = getEventById(db, eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const status = String(req.body?.status || '').trim().toLowerCase();
    const allowed = new Set(['open', 'locked', 'closed', 'archived']);
    if (!allowed.has(status)) {
      return res.status(400).json({ error: 'Invalid status. Use open, locked, closed, or archived.' });
    }

    db.prepare(`
      UPDATE raid_signup_events
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, eventId);

    const client = getDiscordClient();
    if (client) {
      const { refreshEventMessage } = require('./discord/interactions/raidSignupInteractions');
      await refreshEventMessage(db, client, eventId);
    }

    res.json({ ok: true, status });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/raid-signup-events/:id', async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const event = getEventById(db, eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const client = getDiscordClient();
    if (client && event.discord_channel_id && event.discord_message_id) {
      const channel = await client.channels.fetch(event.discord_channel_id).catch(() => null);
      if (channel && typeof channel.messages?.fetch === 'function') {
        const message = await channel.messages.fetch(event.discord_message_id).catch(() => null);
        if (message) {
          await message.delete().catch(() => null);
        }
      }
    }

    db.prepare('DELETE FROM raid_signup_events WHERE id = ?').run(eventId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/public-raid-signups', (req, res) => {
  try {
    const activeEvents = listPublicActiveEvents(db);
    const mapped = activeEvents.map(event => {
      const entries = listEntriesForEvent(db, event.id);
      const groups = event.public_groups === 1 ? listGroupsForEvent(db, event.id) : [];
      return { ...event, public_groups: event.public_groups === 1, entries, groups };
    });
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/raid-signup-groups/:eventId', (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    res.json(listGroupsForEvent(db, eventId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/raid-signup-groups/:eventId', (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    const rows = Array.isArray(req.body) ? req.body : [];
    const deleteExisting = db.prepare('DELETE FROM raid_signup_groups WHERE event_id = ?');
    const insert = db.prepare(`
      INSERT INTO raid_signup_groups (event_id, group_number, group_name, slot_index, player_name, spec_id, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const save = db.transaction(() => {
      deleteExisting.run(eventId);
      rows.forEach(row => {
        const playerName = String(row?.player_name || '').trim();
        if (!playerName) return;
        insert.run(
          eventId,
          Number(row.group_number) || 1,
          String(row.group_name || '').trim(),
          Number(row.slot_index) || 1,
          playerName,
          row.spec_id ? Number(row.spec_id) : null,
          String(row.note || '').trim()
        );
      });
    });

    save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/raid-signup-events/:id/echo', async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const event = getEventById(db, eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (!event.discord_channel_id) return res.status(400).json({ error: 'Event has no Discord channel binding yet' });

    const client = getDiscordClient();
    if (!client) return res.status(503).json({ error: 'Discord client unavailable' });

    const channel = await client.channels.fetch(event.discord_channel_id).catch(() => null);
    if (!channel || typeof channel.send !== 'function') {
      return res.status(404).json({ error: 'Could not resolve Discord channel for this event' });
    }

    const guild = channel.guild || null;
    const entries = listEntriesForEvent(db, eventId);
    const groups = listGroupsForEvent(db, eventId);
    const summary = formatSignupSummary(entries, {
      classIconResolver: entry => {
        const token = resolveClassEmojiToken(guild, entry?.spec_class);
        return token ? `${token} ` : '';
      }
    });
    const tankCount = summary.roleBuckets.tank.length;
    const healerCount = summary.roleBuckets.healer.length;
    const meleeCount = summary.roleBuckets.melee.length;
    const rangedCount = summary.roleBuckets.ranged.length;
    const available = tankCount + healerCount + meleeCount + rangedCount;
    const lateOrTentative = summary.statuses.late.length + summary.statuses.tentative.length;
    const summaryLine = [
      `Available: ${available}${lateOrTentative > 0 ? `(+${lateOrTentative})` : ''}`,
      `Bench: ${summary.statuses.bench.length}`,
      `Late: ${summary.statuses.late.length}`,
      `Tentative: ${summary.statuses.tentative.length}`,
      `Absence: ${summary.statuses.absence.length}`
    ].join(' | ');

    const groupText = (() => {
      if (!groups.length) return 'No groups assigned yet.';
      const byGroup = new Map();
      groups.forEach(row => {
        if (!byGroup.has(row.group_number)) byGroup.set(row.group_number, []);
        byGroup.get(row.group_number).push(row);
      });
      return [...byGroup.keys()].sort((a, b) => a - b).map(groupNumber => {
        const rows = byGroup.get(groupNumber).sort((a, b) => a.slot_index - b.slot_index);
        const groupName = String(rows[0]?.group_name || '').trim() || `Group ${groupNumber}`;
        const line = rows.map(slot => {
          const classIcon = resolveClassEmojiToken(guild, slot?.spec_class);
          const specTag = slot.spec_name ? `[${slot.spec_name}] ` : '';
          const note = slot.note ? ` - ${slot.note}` : '';
          return `${slot.slot_index}. ${classIcon ? `${classIcon} ` : ''}${specTag}${slot.player_name}${note}`;
        }).join('\n');
        return `${groupName}\n${line}`;
      }).join('\n\n');
    })();

    const embed = new EmbedBuilder()
      .setTitle(`Raid Echo: ${event.title}`)
      .setDescription(event.description || 'Signup snapshot')
      .addFields(
        { name: 'Sign Summary', value: summaryLine, inline: false },
        { name: withEmoji(resolveRoleEmojiToken(guild, 'tank'), `Tank (${tankCount})`), value: summary.roleBuckets.tank.join('\n') || 'None', inline: true },
        { name: withEmoji(resolveRoleEmojiToken(guild, 'healer'), `Healer (${healerCount})`), value: summary.roleBuckets.healer.join('\n') || 'None', inline: true },
        { name: withEmoji(resolveRoleEmojiToken(guild, 'melee'), `DPS (Melee) (${meleeCount})`), value: summary.roleBuckets.melee.join('\n') || 'None', inline: true },
        { name: withEmoji(resolveRoleEmojiToken(guild, 'ranged'), `DPS (Ranged) (${rangedCount})`), value: summary.roleBuckets.ranged.join('\n') || 'None', inline: true },
        { name: 'Groups', value: groupText, inline: false }
      )
      .setColor(0x8e44ad)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Placement screenshots, stored inline as base64 data URLs
app.get('/api/raid-assignment-images', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, boss_name, caption, image_data, created_at FROM raid_assignment_images ORDER BY created_at ASC').all();
    const mapped = rows.map(row => {
      const isUrl = typeof row.image_data === 'string' && /^https?:\/\//i.test(row.image_data);
      return {
        ...row,
        image_url: isUrl ? row.image_data : null
      };
    });
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Migration stub: allows callers to persist a hosted image URL now, while
// we still store it in the existing image_data column.
app.post('/api/raid-assignment-images/url', (req, res) => {
  try {
    const { boss_name, caption, image_url } = req.body;
    if (!boss_name || !image_url) return res.status(400).json({ error: 'boss_name and image_url are required' });

    const result = db.prepare('INSERT INTO raid_assignment_images (boss_name, caption, image_data) VALUES (?, ?, ?)').run(boss_name, caption || '', image_url);
    res.json({ id: result.lastInsertRowid, boss_name, caption: caption || '', image_url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/raid-assignment-images', (req, res) => {
  try {
    const { boss_name, caption, image_data } = req.body;
    if (!boss_name || !image_data) return res.status(400).json({ error: 'boss_name and image_data are required' });
    const result = db.prepare('INSERT INTO raid_assignment_images (boss_name, caption, image_data) VALUES (?, ?, ?)').run(boss_name, caption || '', image_data);
    res.json({ id: result.lastInsertRowid, boss_name, caption: caption || '', image_data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/raid-assignment-images/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM raid_assignment_images WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get(['/api', '/api/'], (req, res) => {
  res.json({ ok: true, service: 'Guild Loot API' });
});

const clientBuildPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

setTimeout(() => {
  autoPostRecurringSignupEvents().catch(() => {});
}, 15000);

setInterval(() => {
  autoPostRecurringSignupEvents().catch(() => {});
}, 60 * 1000);

const PORT = process.env.API_PORT || process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Guild Loot API running on http://localhost:${PORT}`));
