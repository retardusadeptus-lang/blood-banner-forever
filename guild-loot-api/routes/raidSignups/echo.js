const express = require('express');
const { getEventById, listEntriesForEvent, listGroupsForEvent } = require('../../discord/utils/raidSignupStore');
const { resolveClassEmojiToken, resolveSpecEmojiToken } = require('../../discord/utils/discordEmojiTokens');
const { EmbedBuilder } = require('discord.js');

function normalizeStatusKey(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'absence') return 'absent';
  return normalized;
}

function normalizeDisplayName(value) {
  return String(value || '').trim().toLowerCase();
}

function getEntryNote(entry) {
  return String(entry?.note || entry?.comment || entry?.comments || '').trim();
}

function buildGroupFields(groups, guild) {
  if (!groups.length) {
    return [{ name: 'Groups', value: 'No groups assigned yet.', inline: false }];
  }

  const byGroup = new Map();
  groups.forEach(row => {
    const key = Number(row.group_number);
    if (key === 0) return;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(row);
  });

  return [...byGroup.keys()].sort((a, b) => a - b).map(groupNumber => {
    const rows = byGroup.get(groupNumber).sort((a, b) => a.slot_index - b.slot_index);
    const groupName = String(rows[0]?.group_name || '').trim() || `Group ${groupNumber}`;
    const value = rows.map(slot => {
      const name = String(slot.player_name || '').trim();
      const icon = resolveSpecEmojiToken(guild, slot?.spec_name, slot?.spec_class) || resolveClassEmojiToken(guild, slot?.spec_class);
      const note = slot.note ? ` - ${slot.note}` : '';
      return `${icon ? `${icon} ` : ''}${name}${note}`;
    }).join('\n') || 'None';

    return { name: groupName, value, inline: true };
  });
}

function buildGroupText(groups, guild) {
  const fields = buildGroupFields(groups, guild);
  return fields.map(field => `${field.name}\n${field.value}`).join('\n\n');
}

function buildBenchList(entries, groups, guild) {
  const groupedNames = new Set(
    groups
      .filter(row => Number(row.group_number) > 0)
      .map(row => normalizeDisplayName(row.player_name || ''))
      .filter(Boolean)
  );
  const officerBenchRows = groups.filter(row => Number(row.group_number) === 0);
  const officerBenchNames = new Set(
    officerBenchRows
      .map(row => normalizeDisplayName(row.player_name || ''))
      .filter(Boolean)
  );

  const officerBenchLabels = officerBenchRows.map(row => {
    const note = String(row.note || '').trim();
    const icon = resolveSpecEmojiToken(guild, row?.spec_name, row?.spec_class) || resolveClassEmojiToken(guild, row?.spec_class);
    const name = `${icon ? `${icon} ` : ''}${row.player_name}`;
    return note ? `${name} - **${note}**` : name;
  });

  const signupBenchLabels = entries
    .filter(entry => normalizeStatusKey(entry.status) === 'bench')
    .filter(entry => {
      const name = normalizeDisplayName(entry.discord_username || entry.player_name || '');
      if (!name) return false;
      return !groupedNames.has(name) && !officerBenchNames.has(name);
    })
    .map(entry => {
      const name = String(entry.discord_username || entry.player_name || '').trim();
      const note = getEntryNote(entry);
      const icon = resolveSpecEmojiToken(guild, entry?.spec_name, entry?.spec_class) || resolveClassEmojiToken(guild, entry?.spec_class);
      const displayName = `${icon ? `${icon} ` : ''}${name}`;
      return note ? `${displayName} - **${note}**` : displayName;
    })
    .filter(Boolean);

  return [...officerBenchLabels, ...signupBenchLabels];
}

function buildRaidSignupEchoRoutes({ db }) {
  const router = express.Router();

  router.post('/raid-signup-events/:id/echo-unsigned-raiders', async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const event = getEventById(db, eventId);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      if (!event.discord_channel_id) return res.status(400).json({ error: 'Event has no Discord channel binding yet' });

      const client = require('../../bot').getDiscordClient();
      if (!client) return res.status(503).json({ error: 'Discord client unavailable' });

      const channel = await client.channels.fetch(event.discord_channel_id).catch(() => null);
      if (!channel || typeof channel.send !== 'function') {
        return res.status(404).json({ error: 'Could not resolve Discord channel for this event' });
      }

      const players = [...new Map((Array.isArray(req.body?.players) ? req.body.players : [])
        .map(player => ({
          name: String(player?.name || player || '').trim(),
          specName: String(player?.spec_name || '').trim(),
          specClass: String(player?.spec_class || '').trim()
        }))
        .filter(player => player.name)
        .map(player => [normalizeDisplayName(player.name), player])).values()];
      const resolvedPlayers = players.map(player => {
        const name = player.name;
        const match = db.prepare(`
          SELECT discord_user_id
          FROM (
            SELECT discord_user_id, updated_at
            FROM raid_signup_user_prefs
            WHERE lower(trim(character_name)) = lower(trim(?))
            UNION ALL
            SELECT discord_user_id, NULL AS updated_at
            FROM roster
            WHERE lower(trim(name)) = lower(trim(?))
          )
          WHERE discord_user_id IS NOT NULL AND trim(discord_user_id) <> ''
          ORDER BY updated_at DESC
          LIMIT 1
        `).get(name, name);
        return { ...player, discordUserId: match?.discord_user_id || null };
      });
      const tagRaiders = req.body?.tag_raiders !== false;
      const mentions = tagRaiders
        ? [...new Set(resolvedPlayers.map(player => player.discordUserId).filter(Boolean))].map(id => `<@${id}>`)
        : [];
      const raiderLines = resolvedPlayers.map(player => {
        const icon = resolveSpecEmojiToken(client, player.specName, player.specClass)
          || resolveClassEmojiToken(client, player.specClass);
        return `${icon ? `${icon} ` : ''}${player.name}`;
      });

      const embed = new EmbedBuilder()
        .setTitle(`Unsigned Raiders: ${event.title}`)
        .setDescription('The following raiders have not signed up for this event.')
        .addFields({ name: 'Unsigned Raiders', value: raiderLines.join('\n') || 'None', inline: false })
        .setColor(0xeab308)
        .setTimestamp();

      await channel.send({
        content: mentions.join(' ') || undefined,
        embeds: [embed]
      });

      res.json({
        ok: true,
        matched: resolvedPlayers.filter(player => player.discordUserId).map(player => player.name),
        unmatched: resolvedPlayers.filter(player => !player.discordUserId).map(player => player.name)
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/raid-signup-events/:id/echo', async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const event = getEventById(db, eventId);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      if (!event.discord_channel_id) return res.status(400).json({ error: 'Event has no Discord channel binding yet' });

      const client = require('../../bot').getDiscordClient();
      if (!client) return res.status(503).json({ error: 'Discord client unavailable' });

      const channel = await client.channels.fetch(event.discord_channel_id).catch(() => null);
      if (!channel || typeof channel.send !== 'function') {
        return res.status(404).json({ error: 'Could not resolve Discord channel for this event' });
      }

      const entries = listEntriesForEvent(db, eventId);
      const groups = listGroupsForEvent(db, eventId);
      const tagAttendees = !!req.body?.tag_attendees;
      const benchLabels = buildBenchList(entries, groups, client);
      const benchList = benchLabels.length ? `Bench: ${benchLabels.join(', ')}` : 'Bench: None';
      const groupFields = buildGroupFields(groups, client);

      const mentionMap = new Map();
      entries.forEach(entry => {
        const status = normalizeStatusKey(entry.status);
        if (entry.discord_user_id && (status === 'signup' || status === 'bench')) {
          mentionMap.set(normalizeDisplayName(entry.discord_username || entry.player_name || ''), `<@${entry.discord_user_id}>`);
        }
      });
      groups.forEach(row => {
        const name = normalizeDisplayName(row.player_name || '');
        if (!name) return;
        const match = entries.find(entry => normalizeDisplayName(entry.discord_username || '') === name || normalizeDisplayName(entry.player_name || '') === name);
        if (match?.discord_user_id) {
          mentionMap.set(name, `<@${match.discord_user_id}>`);
        }
      });
      const mentionContent = tagAttendees ? [...new Set(mentionMap.values())].join(' ') : '';

      const embed = new EmbedBuilder()
        .setTitle(`Raid Echo: ${event.title}`)
        .setDescription(event.description || 'Signup snapshot')
        .addFields(
          { name: 'Bench', value: benchList, inline: false },
          ...groupFields
        )
        .setColor(0x8e44ad)
        .setTimestamp();

      await channel.send({
        content: mentionContent || undefined,
        embeds: [embed]
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildRaidSignupEchoRoutes;
module.exports.buildGroupText = buildGroupText;
module.exports.buildGroupFields = buildGroupFields;
