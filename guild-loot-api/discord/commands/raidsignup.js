const {
  EmbedBuilder
} = require('discord.js');

const {
  listTemplates,
  listOpenEvents,
  listManageableEvents,
  createEventFromTemplate,
  getEventById,
  getAvailableClassesForEvent,
  getAllowedSpecsForEvent,
  listEntriesForEvent,
  listGroupsForEvent,
  formatSignupSummary
} = require('../utils/raidSignupStore');

const { buildSignupEmbed, buildMainSignupComponents, refreshEventMessage } = require('../interactions/raidSignupInteractions');
const { enforceRoleAccess } = require('../utils/discordGuards');
const { resolveRoleEmojiToken, resolveClassEmojiToken } = require('../utils/discordEmojiTokens');

const { SlashCommandBuilder } = require('discord.js');

function summarizeGroups(groups, guild) {
  if (!groups.length) return 'No groups assigned yet.';

  const byGroup = new Map();
  groups.forEach(row => {
    if (!byGroup.has(row.group_number)) byGroup.set(row.group_number, []);
    byGroup.get(row.group_number).push(row);
  });

  const lines = [];
  [...byGroup.keys()].sort((a, b) => a - b).forEach(groupNumber => {
    const rows = byGroup.get(groupNumber).sort((a, b) => a.slot_index - b.slot_index);
    const groupName = String(rows[0]?.group_name || '').trim() || `Group ${groupNumber}`;
    const body = rows.map(slot => {
      const classIcon = resolveClassEmojiToken(guild, slot?.spec_class);
      const specTag = slot.spec_name ? `[${slot.spec_name}] ` : '';
      const note = slot.note ? ` - ${slot.note}` : '';
      return `${slot.slot_index}. ${classIcon ? `${classIcon} ` : ''}${specTag}${slot.player_name}${note}`;
    }).join('\n');
    lines.push(`${groupName}\n${body}`);
  });

  return lines.join('\n\n');
}

function withEmoji(icon, label) {
  return icon ? `${icon} ${label}` : label;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('raidsignup')
    .setDescription('Manage Discord raid signup events')
    .addSubcommand(subcommand =>
      subcommand
        .setName('post')
        .setDescription('Post a signup event from a saved template')
        .addStringOption(option =>
          option
            .setName('template')
            .setDescription('Template to post')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Optional title override')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('scheduled_for')
            .setDescription('Optional schedule text (e.g. 2026-07-08 20:00)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('lock')
        .setDescription('Lock a signup event (disables signups, keeps it visible)')
        .addStringOption(option =>
          option
            .setName('event')
            .setDescription('Event id')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('archive')
        .setDescription('Archive an event (removes from active board)')
        .addStringOption(option =>
          option
            .setName('event')
            .setDescription('Event id')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('unlock')
        .setDescription('Unlock or restore a raid signup event so signups are accepted again')
        .addStringOption(option =>
          option
            .setName('event')
            .setDescription('Event id')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete an event from site and Discord')
        .addStringOption(option =>
          option
            .setName('event')
            .setDescription('Event id')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('echo')
        .setDescription('Echo signup summary and groups to this channel')
        .addStringOption(option =>
          option
            .setName('event')
            .setDescription('Event id')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription('Edit title/description/start time for an event')
        .addStringOption(option =>
          option
            .setName('event')
            .setDescription('Event id')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('New title')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('New description')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('scheduled_for')
            .setDescription('New schedule text, e.g. 2026-07-08 20:00')
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('public_groups')
            .setDescription('Allow groups to be visible on the public website')
            .setRequired(false)
        )
    ),

  async autocomplete(interaction, { db }) {
    const focused = interaction.options.getFocused(true);
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'post' && focused.name === 'template') {
      const templates = listTemplates(db)
        .filter(t => t.is_active)
        .filter(t => t.name.toLowerCase().includes(String(focused.value || '').toLowerCase()))
        .slice(0, 25)
        .map(t => ({ name: `${t.name} (#${t.id})`, value: String(t.id) }));

      await interaction.respond(templates);
      return;
    }

    if ((subcommand === 'lock' || subcommand === 'archive' || subcommand === 'delete' || subcommand === 'echo' || subcommand === 'edit') && focused.name === 'event') {
      const events = listManageableEvents(db)
        .filter(e => `${e.id} ${e.title}`.toLowerCase().includes(String(focused.value || '').toLowerCase()))
        .slice(0, 25)
        .map(e => ({ name: `#${e.id} [${e.status}] ${e.title}`, value: String(e.id) }));

      await interaction.respond(events);
      return;
    }

    if (subcommand === 'unlock' && focused.name === 'event') {
      const archived = listArchivedEvents(db)
        .filter(e => `${e.id} ${e.title}`.toLowerCase().includes(String(focused.value || '').toLowerCase()))
        .slice(0, 25)
        .map(e => ({ name: `#${e.id} [${e.status}] ${e.title}`, value: String(e.id) }));

      await interaction.respond(archived);
      return;
    }

    await interaction.respond([]);
  },

  async execute(interaction, { db }) {
    const hasAccess = await enforceRoleAccess(interaction, db, 'bench');
    if (!hasAccess) return;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'post') {
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
      return;
    }

    if (subcommand === 'edit') {
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

      await interaction.reply({
        content: `Updated event #${eventId}.`,
        ephemeral: true
      });
      return;
    }

    if (subcommand === 'lock') {
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

      await interaction.reply({
        content: `Locked event #${eventId}.`,
        ephemeral: true
      });
      return;
    }

    if (subcommand === 'archive') {
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

      await interaction.reply({
        content: `Archived event #${eventId}.`,
        ephemeral: true
      });
      return;
    }

    if (subcommand === 'unlock') {
      const eventId = Number(interaction.options.getString('event', true));
      const event = getEventById(db, eventId);
      if (!event) {
        await interaction.reply({ content: 'Event not found.', ephemeral: true });
        return;
      }

      db.prepare(`
        UPDATE raid_signup_events
        SET status = 'open', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(eventId);

      await refreshEventMessage(db, interaction.client, eventId);

      await interaction.reply({
        content: `Unlocked event #${eventId}. Signups are enabled again.`,
        ephemeral: true
      });
      return;
    }

    if (subcommand === 'delete') {
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

      await interaction.reply({
        content: `Deleted event #${eventId} from site and Discord.`,
        ephemeral: true
      });
      return;
    }

    if (subcommand === 'echo') {
      const eventId = Number(interaction.options.getString('event', true));
      const event = getEventById(db, eventId);
      if (!event) {
        await interaction.reply({ content: 'Event not found.', ephemeral: true });
        return;
      }

      const entries = listEntriesForEvent(db, eventId);
      const groups = listGroupsForEvent(db, eventId);
      const summary = formatSignupSummary(entries, {
        classIconResolver: entry => {
          const token = resolveClassEmojiToken(interaction.guild || null, entry?.spec_class);
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

      const embed = new EmbedBuilder()
        .setTitle(`Raid Echo: ${event.title}`)
        .setDescription(event.description || 'Raid signup echo')
        .addFields(
          { name: 'Sign Summary', value: summaryLine, inline: false },
          { name: withEmoji(resolveRoleEmojiToken(interaction.guild || null, 'tank'), `Tank (${tankCount})`), value: summary.roleBuckets.tank.join('\n') || 'None', inline: true },
          { name: withEmoji(resolveRoleEmojiToken(interaction.guild || null, 'healer'), `Healer (${healerCount})`), value: summary.roleBuckets.healer.join('\n') || 'None', inline: true },
          { name: withEmoji(resolveRoleEmojiToken(interaction.guild || null, 'melee'), `DPS (Melee) (${meleeCount})`), value: summary.roleBuckets.melee.join('\n') || 'None', inline: true },
          { name: withEmoji(resolveRoleEmojiToken(interaction.guild || null, 'ranged'), `DPS (Ranged) (${rangedCount})`), value: summary.roleBuckets.ranged.join('\n') || 'None', inline: true },
          { name: 'Groups', value: summarizeGroups(groups, interaction.guild || null), inline: false }
        )
        .setColor(0x8e44ad)
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed] });

      await interaction.reply({
        content: `Echo sent for event #${eventId}.`,
        ephemeral: true
      });
      return;
    }
  }
};
