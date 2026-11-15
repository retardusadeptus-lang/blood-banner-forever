const { SlashCommandBuilder } = require('discord.js');
const {
  addAbsenceDates,
  expandAbsenceInput,
  formatAbsenceList,
  formatAbsenceRow,
  listAbsences,
  removeAbsenceDates,
  resolveDiscordUser
} = require('../utils/absenceStore');

function buildDatesOption(option, description) {
  return option
    .setName('dates')
    .setDescription(description)
    .setRequired(true)
    .setAutocomplete(true)
    .setMaxLength(100);
}

function getLinkErrorMessage(reason) {
  if (reason === 'ambiguous-link') {
    return 'Your Discord account is linked to more than one Battle.net account. Ask an officer to resolve the roster links before managing absences.';
  }
  return 'Your Discord account is not linked to a claimed roster character. Sign up for a raid from Discord first, then try again.';
}

function buildUpdatedAbsenceMessage(summary, rows) {
  return `${summary}\n\n${formatAbsenceList(rows, 1700)}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('absence')
    .setDescription('Manage your raid unavailable dates')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Privately show your upcoming unavailable dates')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add unavailable dates')
        .addStringOption(option => buildDatesOption(option, 'Comma-separated YYYY-MM-DD dates or ranges'))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove unavailable dates')
        .addStringOption(option => buildDatesOption(option, 'Comma-separated YYYY-MM-DD dates or ranges'))
    ),

  async autocomplete(interaction, { db }) {
    if (interaction.options.getSubcommand() !== 'remove') {
      await interaction.respond([]);
      return;
    }

    try {
      const link = resolveDiscordUser(db, interaction.user.id);
      if (!link.userId) {
        await interaction.respond([]);
        return;
      }

      const query = String(interaction.options.getFocused() || '').trim().toLowerCase();
      const choices = listAbsences(db, link.userId)
        .map(row => formatAbsenceRow(row))
        .filter(date => date.toLowerCase().includes(query))
        .slice(0, 25)
        .map(date => ({ name: date, value: date }));
      await interaction.respond(choices);
    } catch (error) {
      console.error('[Discord] Absence autocomplete failed:', error.message || error);
      await interaction.respond([]);
    }
  },

  async execute(interaction, { db }) {
    try {
      if (typeof interaction.inGuild === 'function' && !interaction.inGuild()) {
        await interaction.reply({
          content: 'Absence commands must be used in the guild server.',
          ephemeral: true
        });
        return;
      }

      const link = resolveDiscordUser(db, interaction.user.id);
      if (!link.userId) {
        await interaction.reply({ content: getLinkErrorMessage(link.reason), ephemeral: true });
        return;
      }

      const subcommand = interaction.options.getSubcommand();
      if (subcommand === 'list') {
        const rows = listAbsences(db, link.userId);
        await interaction.reply({
          content: formatAbsenceList(rows),
          ephemeral: true
        });
        return;
      }

      const dates = expandAbsenceInput(interaction.options.getString('dates', true));
      if (subcommand === 'add') {
        const result = addAbsenceDates(db, link.userId, dates);
        const rows = listAbsences(db, link.userId);
        const summary = `Added ${result.added} absence date${result.added === 1 ? '' : 's'}${result.alreadyRecorded ? `; ${result.alreadyRecorded} already recorded` : ''}.`;
        await interaction.reply({
          content: buildUpdatedAbsenceMessage(summary, rows),
          ephemeral: true
        });
        return;
      }

      if (subcommand === 'remove') {
        const result = removeAbsenceDates(db, link.userId, dates);
        const rows = listAbsences(db, link.userId);
        const summary = `Removed ${result.removed} absence date${result.removed === 1 ? '' : 's'}${result.notRecorded ? `; ${result.notRecorded} were not recorded` : ''}.`;
        await interaction.reply({
          content: buildUpdatedAbsenceMessage(summary, rows),
          ephemeral: true
        });
        return;
      }

      await interaction.reply({ content: 'Unknown absence action.', ephemeral: true });
    } catch (error) {
      console.error('[Discord] Absence command failed:', error.message || error);
      const response = {
        content: error.message || 'Unable to update your absences.',
        ephemeral: true
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(response);
      } else {
        await interaction.reply(response);
      }
    }
  }
};
