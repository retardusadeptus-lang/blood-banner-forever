const { EmbedBuilder } = require('discord.js');
const { resolveRoleEmojiToken, resolveClassEmojiToken, resolveSpecEmojiToken } = require('../utils/discordEmojiTokens');
const { parseScheduledUnix } = require('../../utils/raidSignupTime');
const {
  getEventById,
  getAvailableClassesForEvent,
  getAllowedSpecsForEvent,
  listEntriesForEvent
} = require('../utils/raidSignupStore');
const { buildMainSignupComponents } = require('./raidSignupComponents');
const { formatSignupSummary } = require('../utils/raidSignupStore/summary');

function withEmoji(icon, label) {
  return icon ? `${icon} ${label}` : label;
}

function buildSignupEmbed(event, entries, guildOrClient = null) {
  const summary = formatSignupSummary(entries, {
    classIconResolver: entry => {
      const token = resolveSpecEmojiToken(guildOrClient, entry?.spec_name, entry?.spec_class);
      return token ? `${token} ` : '';
    }
  });
  const scheduledUnix = parseScheduledUnix(event.scheduled_for);

  const roleField = (name, arr) => ({
    name,
    value: arr.length ? arr.join('\n') : 'None',
    inline: true
  });

  const blankField = () => ({
    name: '\u200b',
    value: '\u200b',
    inline: true
  });

  const statusLine = [
    `Available: ${summary.roleBuckets.tank.length + summary.roleBuckets.healer.length + summary.roleBuckets.melee.length + summary.roleBuckets.ranged.length}${summary.statuses.late.length + summary.statuses.tentative.length > 0 ? `(+${summary.statuses.late.length + summary.statuses.tentative.length})` : ''}`,
    `Bench: ${summary.statuses.bench.length}`,
    `Late: ${summary.statuses.late.length}`,
    `Tentative: ${summary.statuses.tentative.length}`,
    `Absence: ${summary.statuses.absence.length}`
  ].join(' | ');

  const statusDetails = [
    summary.statuses.bench.length ? `Bench: ${summary.statuses.bench.join(', ')}` : '',
    summary.statuses.late.length ? `Late: ${summary.statuses.late.join(', ')}` : '',
    summary.statuses.tentative.length ? `Tentative: ${summary.statuses.tentative.join(', ')}` : '',
    summary.statuses.absence.length ? `Absence: ${summary.statuses.absence.join(', ')}` : ''
  ].filter(Boolean).join('\n') || 'None';

  const tankCount = summary.roleBuckets.tank.length;
  const healerCount = summary.roleBuckets.healer.length;
  const meleeCount = summary.roleBuckets.melee.length;
  const rangedCount = summary.roleBuckets.ranged.length;

  return new EmbedBuilder()
    .setTitle(event.title || 'Raid Signup')
    .setDescription(event.description || 'Use the class selector below to sign up.')
    .addFields(
      {
        name: 'Starts',
        value: scheduledUnix ? `<t:${scheduledUnix}:F>\n(<t:${scheduledUnix}:R>)` : 'Not scheduled',
        inline: false
      },
      { name: 'Sign Summary', value: statusLine, inline: false },
      { name: 'Bench / Late / Tentative / Absence', value: statusDetails, inline: false },
      roleField(withEmoji(resolveRoleEmojiToken(guildOrClient, 'tank'), `Tank (${tankCount})`), summary.roleBuckets.tank),
      blankField(),
      roleField(withEmoji(resolveRoleEmojiToken(guildOrClient, 'healer'), `Healer (${healerCount})`), summary.roleBuckets.healer),
      roleField(withEmoji(resolveRoleEmojiToken(guildOrClient, 'ranged'), `DPS (Ranged) (${rangedCount})`), summary.roleBuckets.ranged),
      blankField(),
      roleField(withEmoji(resolveRoleEmojiToken(guildOrClient, 'melee'), `DPS (Melee) (${meleeCount})`), summary.roleBuckets.melee)
    )
    .setColor(0x3498db)
    .setTimestamp();
}

async function refreshEventMessage(db, client, eventId, _userId = null) {
  const event = getEventById(db, eventId);
  if (!event || !event.discord_channel_id || !event.discord_message_id) return;

  const classes = getAvailableClassesForEvent(db, eventId);
  const specs = getAllowedSpecsForEvent(db, eventId);
  const selectedClass = '';
  // The shared event post must stay neutral for everyone in the channel.
  // User-specific values are stored in raid_signup_user_prefs for the individual
  // interaction flow, but they must not be rendered back onto the public message.
  const preferredCharacter = '';
  const preferredSpecId = 0;
  const entries = listEntriesForEvent(db, eventId);

  const channel = await client.channels.fetch(event.discord_channel_id).catch(() => null);
  if (!channel || typeof channel.messages?.fetch !== 'function') return;

  if (client && client.application && typeof client.application.emojis?.fetch === 'function') {
    await client.application.emojis.fetch().catch(() => {});
  }

  const embed = buildSignupEmbed(event, entries, client || channel.guild || null);

  const message = await channel.messages.fetch(event.discord_message_id).catch(() => null);
  if (!message) return;

  await message.edit({
    embeds: [embed],
    components: buildMainSignupComponents(
      eventId,
      classes,
      specs,
      selectedClass,
      event.status !== 'open',
      preferredCharacter,
      preferredSpecId
    )
  });
}

module.exports = {
  buildSignupEmbed,
  refreshEventMessage
};
