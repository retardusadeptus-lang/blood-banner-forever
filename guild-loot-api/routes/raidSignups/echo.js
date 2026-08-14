const express = require('express');
const { getEventById, listEntriesForEvent, listGroupsForEvent, formatSignupSummary } = require('../../discord/utils/raidSignupStore');
const { resolveClassEmojiToken, resolveRoleEmojiToken } = require('../../discord/utils/discordEmojiTokens');
const { EmbedBuilder } = require('discord.js');

function withEmoji(icon, label) {
  return icon ? `${icon} ${label}` : label;
}

function buildRaidSignupEchoRoutes({ db }) {
  const router = express.Router();

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
          { name: '\u200b', value: '\u200b', inline: true },
          { name: withEmoji(resolveRoleEmojiToken(guild, 'healer'), `Healer (${healerCount})`), value: summary.roleBuckets.healer.join('\n') || 'None', inline: true },
          { name: withEmoji(resolveRoleEmojiToken(guild, 'ranged'), `DPS (Ranged) (${rangedCount})`), value: summary.roleBuckets.ranged.join('\n') || 'None', inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
          { name: withEmoji(resolveRoleEmojiToken(guild, 'melee'), `DPS (Melee) (${meleeCount})`), value: summary.roleBuckets.melee.join('\n') || 'None', inline: true },
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

  return router;
}

module.exports = buildRaidSignupEchoRoutes;
