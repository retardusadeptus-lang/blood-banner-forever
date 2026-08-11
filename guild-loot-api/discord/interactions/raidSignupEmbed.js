const { EmbedBuilder } = require('discord.js');
const { resolveRoleEmojiToken } = require('../utils/discordEmojiTokens');
const { parseScheduledUnix } = require('../../utils/raidSignupTime');
const {
  getEventById,
  getAvailableClassesForEvent,
  getEventClassFilter,
  setEventClassFilter,
  getAllowedSpecsByClass,
  getAllowedSpecsForEvent,
  listEntriesForEvent
} = require('../utils/raidSignupStore');
const { buildMainSignupComponents } = require('./raidSignupComponents');
const { formatSignupSummary } = require('../utils/raidSignupStore/summary');

function withEmoji(icon, label) {
  return icon ? `${icon} ${label}` : label;
}

function buildSignupEmbed(event, entries, guild = null) {
  const summary = formatSignupSummary(entries, {
    classIconResolver: entry => {
      const token = resolveRoleEmojiToken(guild, entry?.spec_class);
      return token ? `${token} ` : '';
    }
  });
  const scheduledUnix = parseScheduledUnix(event.scheduled_for);

  const roleField = (name, arr) => ({
    name,
    value: arr.length ? arr.join('\n') : 'None',
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
      roleField(withEmoji(resolveRoleEmojiToken(guild, 'tank'), `Tank (${tankCount})`), summary.roleBuckets.tank),
      roleField(withEmoji(resolveRoleEmojiToken(guild, 'healer'), `Healer (${healerCount})`), summary.roleBuckets.healer),
      roleField(withEmoji(resolveRoleEmojiToken(guild, 'melee'), `DPS (Melee) (${meleeCount})`), summary.roleBuckets.melee),
      roleField(withEmoji(resolveRoleEmojiToken(guild, 'ranged'), `DPS (Ranged) (${rangedCount})`), summary.roleBuckets.ranged)
    )
    .setColor(0x3498db)
    .setTimestamp();
}

async function refreshEventMessage(db, client, eventId) {
  const event = getEventById(db, eventId);
  if (!event || !event.discord_channel_id || !event.discord_message_id) return;

  const classes = getAvailableClassesForEvent(db, eventId);
  const selectedFilter = getEventClassFilter(db, eventId)?.selected_class;
  const selectedClass = classes.includes(selectedFilter) ? selectedFilter : (classes[0] || '');
  if (selectedClass && selectedClass !== selectedFilter) {
    setEventClassFilter(db, eventId, selectedClass);
  }

  const specs = selectedClass
    ? getAllowedSpecsByClass(db, eventId, selectedClass)
    : getAllowedSpecsForEvent(db, eventId);
  const entries = listEntriesForEvent(db, eventId);

  const channel = await client.channels.fetch(event.discord_channel_id).catch(() => null);
  if (!channel || typeof channel.messages?.fetch !== 'function') return;

  const embed = buildSignupEmbed(event, entries, channel.guild || null);

  const message = await channel.messages.fetch(event.discord_message_id).catch(() => null);
  if (!message) return;

  await message.edit({
    embeds: [embed],
    components: buildMainSignupComponents(eventId, classes, specs, selectedClass, event.status !== 'open')
  });
}

module.exports = {
  buildSignupEmbed,
  refreshEventMessage
};
