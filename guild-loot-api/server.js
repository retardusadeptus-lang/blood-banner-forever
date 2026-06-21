const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const fs = require('fs');
const path = require('path'); // Added for deployment pathway flexibility

const app = express();
app.use(cors());
app.use(express.json());

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

// ==========================================
// DISCORD WEBHOOKS
// ==========================================
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1472708740993253570/NVYBC50w0AIWSn6d0dX-8oDMJLyI6sL0OskRxTRYP59ZKWRoalzDczdN6q-8dyX43XhN';
const SITE_URL = process.env.SITE_URL || 'https://tbc-loot-dashboard.vercel.app/';

async function postToDiscord(payload) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
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
      title: '🏦 Guild Bank Inventory Report',
      description: `[**Click here to view full inventory**](${SITE_URL})`,
      color: 3066993,
      fields: [
        { name: '🧪 Consumables', value: getCategoryBlock('Consumable'), inline: true },
        { name: '💎 Materials', value: getCategoryBlock('Materials'), inline: true },
        { name: '⚔️ Gear', value: getCategoryBlock('Gear'), inline: true },
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
      title: isApproved ? (isPartial ? '⚠️ Bank Request Partially Approved' : '✅ Bank Request Approved') : '❌ Bank Request Denied',
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
    db.prepare('DELETE FROM roster').run();
    const insert = db.prepare('INSERT INTO roster (name, spec_id, in_raid) VALUES (?, ?, ?)');

    const updatedRosters = players.map(p => {
      const info = insert.run(p.name, p.spec_id, p.in_raid ? 1 : 0);
      return { id: info.lastInsertRowid, name: p.name, spec_id: p.spec_id, in_raid: p.in_raid };
    });

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
    const row = db.prepare('SELECT data FROM bis_priorities WHERE phase = ?').get(req.params.phase);
    res.json(row ? JSON.parse(row.data) : {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/bis-priorities/:phase', (req, res) => {
  try {
    const exists = db.prepare('SELECT id FROM bis_priorities WHERE phase = ?').get(req.params.phase);
    if (exists) {
      db.prepare('UPDATE bis_priorities SET data = ? WHERE phase = ?').run(JSON.stringify(req.body), req.params.phase);
    } else {
      db.prepare('INSERT INTO bis_priorities (phase, data) VALUES (?, ?)').run(req.params.phase, JSON.stringify(req.body));
    }
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
    const row = db.prepare('SELECT data FROM scoring_config WHERE id = 1').get();
    res.json(row ? JSON.parse(row.data) : {
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
    const exists = db.prepare('SELECT id FROM scoring_config WHERE id = 1').get();
    if (exists) {
      db.prepare('UPDATE scoring_config SET data = ? WHERE id = 1').run(JSON.stringify(req.body));
    } else {
      db.prepare('INSERT INTO scoring_config (id, data) VALUES (1, ?)').run(JSON.stringify(req.body));
    }
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
    const { player_id, item_wowhead_id, item_name, quantity, reason } = req.body;

    const result = db.prepare(`
      INSERT INTO bank_requests (player_id, item_wowhead_id, item_name, quantity, reason, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(player_id, item_wowhead_id, item_name, quantity || 1, reason || '');

    const player = db.prepare('SELECT name FROM roster WHERE id = ?').get(player_id);

    await sendBankRequestWebhook({
      player_name: player?.name || 'Unknown',
      item_name,
      quantity: quantity || 1,
      reason
    });

    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/bank-requests/:id', async (req, res) => {
  try {
    const { status, price, officer_note, approved_quantity } = req.body;

    db.prepare(`
      UPDATE bank_requests
      SET status = ?, price = ?, officer_note = ?, approved_quantity = ?, resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, price || null, officer_note || '', approved_quantity || null, req.params.id);

    const request = db.prepare('SELECT * FROM bank_requests WHERE id = ?').get(req.params.id);
    const player = db.prepare('SELECT name FROM roster WHERE id = ?').get(request.player_id);

    await sendBankResolutionWebhook({
      player_name: player?.name || 'Unknown',
      item_name: request.item_name,
      quantity: request.quantity,
      status,
      price,
      officer_note,
      approved_quantity
    });

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
    const row = db.prepare('SELECT enabled_bosses FROM raid_assignment_config ORDER BY id LIMIT 1').get();
    res.json(row ? JSON.parse(row.enabled_bosses) : []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/raid-assignment-config', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM raid_assignment_config ORDER BY id LIMIT 1').get();
    if (existing) {
      db.prepare('UPDATE raid_assignment_config SET enabled_bosses = ? WHERE id = ?').run(JSON.stringify(req.body), existing.id);
    } else {
      db.prepare('INSERT INTO raid_assignment_config (enabled_bosses) VALUES (?)').run(JSON.stringify(req.body));
    }
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

app.listen(3001, () => console.log('Guild Loot API running on http://localhost:3001'));