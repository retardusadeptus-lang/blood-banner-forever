const { EmbedBuilder } = require('discord.js');
const {
  listTemplates,
  createEventFromTemplate,
  getEventById,
  getAvailableClassesForEvent,
  getAllowedSpecsForEvent,
  listEntriesForEvent,
  listGroupsForEvent
} = require('../../utils/raidSignupStore');
const {
  buildSignupEmbed,
  buildMainSignupComponents,
  refreshEventMessage
} = require('../../interactions/raidSignupInteractions');
const { buildEchoEmbed } = require('./summary');

async function postEvent(interaction, db) {
  const templateId = Number(interaction.options.getString('template', true));
  const title = String(interaction.options.getString('title') || '').trim();
  const scheduledFor = String(interaction.options.getString('scheduled_for') || '').trim();

  const event = createEventFromTemplate(db, templateId, {
    title: title || undefined,
    scheduledFor: scheduledFor || undefined
  });

  const embed = buildSignupEmbed(event, [], interaction.guild || null);
  const classes = getAvailableClassesForEvent(db, event.id);
  const selectedClass = classes[0] || '';
  const specs = selectedClass
    ? getAllowedSpecsForEvent(db, event.id).filter(spec => String(spec.class || '').toLowerCase() === String(selectedClass).toLowerCase())
    : getAllowedSpecsForEvent(db, event.id);

  const message = await interaction.channel.send({
    embeds: [embed],
    components: buildMainSignupComponents(event.id, classes, specs, selectedClass, false)
  });

  db.prepare(`
    UPDATE raid_signup_events
    SET discord_channel_id = ?, discord_message_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(String(interaction.channelId), String(message.id), event.id);

  await interaction.reply({
    content: `Posted signup event #${event.id} from template #${templateId}.`,
    ephemeral: true
  });

  await refreshEventMessage(db, interaction.client, event.id);
}

async function editEvent(interaction, db) {
  const eventId = Number(interaction.options.getString('event', true));
  const event = getEventById(db, eventId);
  if (!event) {
    await interaction.reply({ content: 'Event not found.', ephemeral: true });
    return;
  }

  const title = interaction.options.getString('title');
  const description = interaction.options.getString('description');
  const scheduledFor = interaction.options.getString('scheduled_for');
  const publicGroups = interaction.options.getBoolean('public_groups');

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
    title !== null ? String(title).trim() : null,
    description !== null ? String(description).trim() : null,
    scheduledFor !== null ? String(scheduledFor).trim() : null,
    publicGroups !== null ? (publicGroups ? 1 : 0) : null,
    eventId
  );

  await refreshEventMessage(db, interaction.client, eventId);
  await interaction.reply({ content: `Updated event #${eventId}.`, ephemeral: true });
}

async function lockEvent(interaction, db) {
  const eventId = Number(interaction.options.getString('event', true));
  const event = getEventById(db, eventId);
  if (!event) {
    await interaction.reply({ content: 'Event not found.', ephemeral: true });
    return;
  }

  db.prepare(`
    UPDATE raid_signup_events
    SET status = 'locked', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(eventId);

  await refreshEventMessage(db, interaction.client, eventId);
  await interaction.reply({ content: `Locked event #${eventId}.`, ephemeral: true });
}

async function archiveEvent(interaction, db) {
  const eventId = Number(interaction.options.getString('event', true));
  const event = getEventById(db, eventId);
  if (!event) {
    await interaction.reply({ content: 'Event not found.', ephemeral: true });
    return;
  }

  db.prepare(`
    UPDATE raid_signup_events
    SET status = 'archived', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(eventId);

  await refreshEventMessage(db, interaction.client, eventId);
  await interaction.reply({ content: `Archived event #${eventId}.`, ephemeral: true });
}

async function deleteEvent(interaction, db) {
  const eventId = Number(interaction.options.getString('event', true));
  const event = getEventById(db, eventId);
  if (!event) {
    await interaction.reply({ content: 'Event not found.', ephemeral: true });
    return;
  }

  if (event.discord_channel_id && event.discord_message_id) {
    const channel = await interaction.client.channels.fetch(event.discord_channel_id).catch(() => null);
    if (channel && typeof channel.messages?.fetch === 'function') {
      const message = await channel.messages.fetch(event.discord_message_id).catch(() => null);
      if (message) {
        await message.delete().catch(() => null);
      }
    }
  }

  db.prepare('DELETE FROM raid_signup_events WHERE id = ?').run(eventId);
  await interaction.reply({ content: `Deleted event #${eventId} from site and Discord.`, ephemeral: true });
}

async function echoEvent(interaction, db) {
  const eventId = Number(interaction.options.getString('event', true));
  const event = getEventById(db, eventId);
  if (!event) {
    await interaction.reply({ content: 'Event not found.', ephemeral: true });
    return;
  }

  const entries = listEntriesForEvent(db, eventId);
  const groups = listGroupsForEvent(db, eventId);
  const embed = buildEchoEmbed(interaction, event, entries, groups);

  await interaction.channel.send({ embeds: [embed] });
  await interaction.reply({ content: `Echo sent for event #${eventId}.`, ephemeral: true });
}

module.exports = {
  postEvent,
  editEvent,
  lockEvent,
  archiveEvent,
  deleteEvent,
  echoEvent
};
