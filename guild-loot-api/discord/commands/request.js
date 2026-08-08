const crypto = require('crypto');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { enforceRoleAccess, respondRosterAutocomplete, escapeLike } = require('../utils/discordGuards');

function generateRequestGroupId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `grp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function findBankRequestableItem(db, itemName) {
  const current = db.prepare(`
    SELECT name, item_wowhead_id
    FROM bank_items
    WHERE lower(name) = lower(?)
    ORDER BY count DESC, id DESC
    LIMIT 1
  `).get(itemName);
  if (current) return current;

  const historical = db.prepare(`
    SELECT item_name as name, item_wowhead_id
    FROM bank_requests
    WHERE lower(item_name) = lower(?)
    ORDER BY id DESC
    LIMIT 1
  `).get(itemName);

  return historical || null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('request')
    .setDescription('Create a guild bank item request')
    .addStringOption(option =>
      option
        .setName('item')
        .setDescription('Item to request')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('How many of item to request')
        .setRequired(true)
        .setMinValue(1)
    )
    .addIntegerOption(option =>
      option
        .setName('character')
        .setDescription('Character in roster')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
      option
        .setName('item2')
        .setDescription('Optional second item to request')
        .setRequired(false)
        .setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount2')
        .setDescription('How many of item2 to request')
        .setRequired(false)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option
        .setName('item3')
        .setDescription('Optional third item to request')
        .setRequired(false)
        .setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount3')
        .setDescription('How many of item3 to request')
        .setRequired(false)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Optional reason for this request')
        .setRequired(false)
    ),

  async autocomplete(interaction, { db }) {
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === 'character') {
      await respondRosterAutocomplete(interaction, db);
      return;
    }

    if (!focusedOption.name.startsWith('item')) {
      await interaction.respond([]);
      return;
    }

    const likeInput = `%${escapeLike(String(focusedOption.value || '').trim())}%`;

    const rows = db
      .prepare(`
        SELECT name
        FROM (
          SELECT name FROM bank_items WHERE name LIKE ? ESCAPE '\\'
          UNION
          SELECT item_name AS name FROM bank_requests WHERE item_name LIKE ? ESCAPE '\\'
        ) AS bank_requestable
        ORDER BY name ASC
        LIMIT 25
      `)
      .all(likeInput, likeInput);

    const choices = rows.map(row => ({ name: row.name, value: row.name }));
    await interaction.respond(choices);
  },

  async execute(interaction, { db }) {
    const hasAccess = await enforceRoleAccess(interaction, db, 'request');
    if (!hasAccess) return;

    const itemName = interaction.options.getString('item', true).trim();
    const amount = interaction.options.getInteger('amount', true);
    const itemName2 = (interaction.options.getString('item2') || '').trim();
    const amount2 = interaction.options.getInteger('amount2');
    const itemName3 = (interaction.options.getString('item3') || '').trim();
    const amount3 = interaction.options.getInteger('amount3');
    const characterId = interaction.options.getInteger('character', true);
    const reason = (interaction.options.getString('reason') || '').trim();

    if ((itemName2 && !amount2) || (!itemName2 && amount2)) {
      await interaction.reply({
        content: 'If item2 is provided, amount2 is required (and vice versa).',
        ephemeral: true
      });
      return;
    }

    if ((itemName3 && !amount3) || (!itemName3 && amount3)) {
      await interaction.reply({
        content: 'If item3 is provided, amount3 is required (and vice versa).',
        ephemeral: true
      });
      return;
    }

    const player = db
      .prepare('SELECT id, name FROM roster WHERE id = ? LIMIT 1')
      .get(characterId);

    if (!player) {
      await interaction.reply({
        content: 'Selected character was not found in roster.',
        ephemeral: true
      });
      return;
    }

    const requestedPairs = [
      { name: itemName, quantity: amount },
      ...(itemName2 ? [{ name: itemName2, quantity: amount2 }] : []),
      ...(itemName3 ? [{ name: itemName3, quantity: amount3 }] : [])
    ];

    const mergedByName = new Map();
    requestedPairs.forEach(pair => {
      const key = pair.name.toLowerCase();
      const existing = mergedByName.get(key);
      if (existing) {
        existing.quantity += pair.quantity;
      } else {
        mergedByName.set(key, { ...pair });
      }
    });

    const normalizedItems = [];
    for (const pair of mergedByName.values()) {
      const found = findBankRequestableItem(db, pair.name);
      if (!found) {
        await interaction.reply({
          content: `Item "${pair.name}" was not found in guild bank items or request history.`,
          ephemeral: true
        });
        return;
      }

      normalizedItems.push({
        item_name: found.name,
        item_wowhead_id: Number(found.item_wowhead_id || 0),
        quantity: pair.quantity
      });
    }

    if (normalizedItems.length === 0) {
      await interaction.reply({
        content: 'At least one valid item is required.',
        ephemeral: true
      });
      return;
    }

    const insert = db.prepare(`
      INSERT INTO bank_requests (
        player_id,
        item_wowhead_id,
        item_name,
        quantity,
        reason,
        status,
        request_group_id,
        requester_name,
        requester_discord_user_id,
        requester_discord_username
      )
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `);

    const requestGroupId = normalizedItems.length > 1 ? generateRequestGroupId() : null;
    const createdIds = [];

    const insertAll = db.transaction(() => {
      normalizedItems.forEach(item => {
        const result = insert.run(
          player.id,
          item.item_wowhead_id,
          item.item_name,
          item.quantity,
          reason,
          requestGroupId,
          player.name,
          interaction.user.id,
          interaction.user.globalName || interaction.user.username
        );
        createdIds.push(result.lastInsertRowid);
      });
    });

    insertAll();

    const itemLines = normalizedItems.map(item => `- ${item.item_name} x${item.quantity}`).join('\n');

    const embed = new EmbedBuilder()
      .setTitle(normalizedItems.length > 1 ? 'Bank Basket Submitted' : 'Bank Request Submitted')
      .setColor(0xf1c40f)
      .addFields(
        { name: 'Character', value: player.name, inline: true },
        { name: 'Items', value: itemLines, inline: false },
        { name: 'Reason', value: reason || 'No reason provided', inline: false },
        ...(requestGroupId ? [{ name: 'Request Group ID', value: requestGroupId, inline: false }] : [])
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
