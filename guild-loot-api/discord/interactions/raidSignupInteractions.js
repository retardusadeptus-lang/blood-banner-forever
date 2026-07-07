const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder
} = require('discord.js');

const {
  getEventById,
  getAvailableClassesForEvent,
  getAllowedSpecsForEvent,
  getAllowedSpecsByClass,
  getEventClassFilter,
  setEventClassFilter,
  getDraft,
  upsertDraft,
  upsertUserPreferredSpec,
  getUserPreferredSpec,
  upsertSignupEntry,
  listEntriesForEvent,
  formatSignupSummary
} = require('../utils/raidSignupStore');
const {
  resolveRoleEmojiToken,
  resolveClassEmojiToken
} = require('../utils/discordEmojiTokens');

function buildMainSignupComponents(eventId, classes, specs, selectedClass, disabled = false) {
  const classOptions = classes.slice(0, 25).map(className => ({
    label: className,
    value: className,
    default: String(className) === String(selectedClass || '')
  }));

  const classSelect = new StringSelectMenuBuilder()
    .setCustomId(`rsu:class:${eventId}`)
    .setPlaceholder(disabled ? 'Event is closed' : 'Filter by class')
    .setMinValues(1)
    .setMaxValues(1)
    .setDisabled(disabled)
    .addOptions(classOptions.length ? classOptions : [{ label: 'No classes configured', value: 'none' }]);

  const options = specs.slice(0, 25).map(spec => ({
    label: `${spec.class} - ${spec.spec}`,
    value: String(spec.id)
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId(`rsu:spec:${eventId}`)
    .setPlaceholder(disabled ? 'Event is closed' : 'Select your spec')
    .setMinValues(1)
    .setMaxValues(1)
    .setDisabled(disabled)
    .addOptions(options.length ? options : [{ label: 'No specs configured', value: 'none' }]);

  const statusRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`rsu:status:${eventId}:signup`).setLabel('Sign Up').setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`rsu:status:${eventId}:bench`).setLabel('Bench').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`rsu:status:${eventId}:late`).setLabel('Late').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`rsu:status:${eventId}:tentative`).setLabel('Tentative').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`rsu:status:${eventId}:absence`).setLabel('Absence').setStyle(ButtonStyle.Danger).setDisabled(disabled)
  );

  return [new ActionRowBuilder().addComponents(classSelect), new ActionRowBuilder().addComponents(select), statusRow];
}

function parseScheduledUnix(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?(?:\s*CET)?$/i);
  if (ymd) {
    const [, yyyy, mm, dd, hh = '20', min = '00'] = ymd;
    const parsed = Date.parse(`${yyyy}-${mm}-${dd}T${hh}:${min}:00+01:00`);
    if (!Number.isNaN(parsed)) return Math.floor(parsed / 1000);
  }

  const dmy = raw.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?(?:\s*CET)?$/i);
  if (dmy) {
    const [, dd, mm, yyyy, hh = '20', min = '00'] = dmy;
    const parsed = Date.parse(`${yyyy}-${mm}-${dd}T${hh}:${min}:00+01:00`);
    if (!Number.isNaN(parsed)) return Math.floor(parsed / 1000);
  }

  const normalized = raw.replace(' ', 'T');
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) return null;
  return Math.floor(parsed / 1000);
}

function getCurrentEntry(db, eventId, discordUserId) {
  return db.prepare(`
    SELECT spec_id, status
    FROM raid_signup_entries
    WHERE event_id = ? AND discord_user_id = ?
    LIMIT 1
  `).get(eventId, discordUserId);
}

function withEmoji(icon, label) {
  return icon ? `${icon} ${label}` : label;
}

function buildSignupEmbed(event, entries, guild = null) {
  const summary = formatSignupSummary(entries, {
    classIconResolver: entry => {
      const token = resolveClassEmojiToken(guild, entry?.spec_class);
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

function resolveDisplayName(interaction) {
  if (interaction.member && interaction.member.displayName) {
    return String(interaction.member.displayName);
  }
  return interaction.user.username;
}

async function handleSpecSelect(interaction, db, eventId) {
  const event = getEventById(db, eventId);
  if (!event || event.status !== 'open') {
    await interaction.update({ content: 'This signup event is closed.', components: [] });
    return true;
  }

  const specId = Number(interaction.values?.[0] || 0);
  if (!specId) {
    await interaction.update({ content: 'Invalid spec selection.', components: interaction.message.components });
    return true;
  }

  upsertDraft(db, eventId, interaction.user.id, specId);
  upsertUserPreferredSpec(db, interaction.user.id, specId);

  await interaction.deferUpdate();

  return true;
}

async function handleClassFilterSelect(interaction, db, eventId) {
  const event = getEventById(db, eventId);
  if (!event || event.status !== 'open') {
    await interaction.reply({ content: 'This signup event is closed.', ephemeral: true });
    return true;
  }

  const className = String(interaction.values?.[0] || '').trim();
  if (!className || className === 'none') {
    await interaction.reply({ content: 'Invalid class selection.', ephemeral: true });
    return true;
  }

  setEventClassFilter(db, eventId, className);
  await interaction.deferUpdate();
  await refreshEventMessage(db, interaction.client, eventId);
  return true;
}

async function handleStatusButton(interaction, db, eventId, status) {
  const event = getEventById(db, eventId);
  if (!event || event.status !== 'open') {
    await interaction.reply({ content: 'This signup event is closed.', ephemeral: true });
    return true;
  }

  const normalizedStatus = String(status || '').toLowerCase();
  const allowed = new Set(['signup', 'bench', 'late', 'tentative', 'absence']);
  if (!allowed.has(normalizedStatus)) {
    await interaction.reply({ content: 'Unknown status action.', ephemeral: true });
    return true;
  }

  let specId = null;
  const draft = getDraft(db, eventId, interaction.user.id);
  if (draft?.spec_id) specId = Number(draft.spec_id);
  if (!specId) {
    const existing = getCurrentEntry(db, eventId, interaction.user.id);
    if (existing?.spec_id) specId = Number(existing.spec_id);
  }
  if (!specId) {
    const preferred = getUserPreferredSpec(db, interaction.user.id);
    if (preferred?.spec_id) specId = Number(preferred.spec_id);
  }

  if (normalizedStatus === 'signup' && !specId) {
    await interaction.reply({
      content: 'Select a spec first in the class menu, then click Sign Up.',
      ephemeral: true
    });
    return true;
  }

  const displayName = resolveDisplayName(interaction);
  upsertSignupEntry(db, eventId, interaction.user.id, displayName, normalizedStatus, specId);
  if (specId) {
    upsertUserPreferredSpec(db, interaction.user.id, specId);
  }

  await interaction.deferUpdate();
  await refreshEventMessage(db, interaction.client, eventId);

  return true;
}

async function handleRaidSignupComponent(interaction, { db }) {
  const customId = String(interaction.customId || '');
  if (!customId.startsWith('rsu:')) return false;

  const parts = customId.split(':');
  const type = parts[1];
  const eventId = Number(parts[2] || 0);

  if (!eventId) {
    await interaction.reply({ content: 'Invalid signup event.', ephemeral: true }).catch(() => {});
    return true;
  }

  if (interaction.isStringSelectMenu()) {
    if (type === 'class') {
      return handleClassFilterSelect(interaction, db, eventId);
    }
    if (type === 'spec') {
      return handleSpecSelect(interaction, db, eventId);
    }
  }

  if (interaction.isButton() && type === 'status') {
    const status = parts[3] || '';
    return handleStatusButton(interaction, db, eventId, status);
  }

  return false;
}

module.exports = {
  handleRaidSignupComponent,
  buildSignupEmbed,
  buildMainSignupComponents,
  refreshEventMessage
};
