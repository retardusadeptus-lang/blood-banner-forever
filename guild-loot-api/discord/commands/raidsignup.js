const { enforceRoleAccess } = require('../utils/discordGuards');
const { buildRaidsignupCommand } = require('./raidsignup/commandDefinition');
const { autocomplete } = require('./raidsignup/autocomplete');
const {
  postEvent,
  editEvent,
  lockEvent,
  archiveEvent,
  deleteEvent,
  echoEvent
} = require('./raidsignup/actions');

module.exports = {
  data: buildRaidsignupCommand(),

  async autocomplete(interaction, { db }) {
    await autocomplete(interaction, db);
  },

  async execute(interaction, { db }) {
    const hasAccess = await enforceRoleAccess(interaction, db, 'bench');
    if (!hasAccess) return;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'post') {
      await postEvent(interaction, db);
      return;
    }

    if (subcommand === 'edit') {
      await editEvent(interaction, db);
      return;
    }

    if (subcommand === 'lock') {
      await lockEvent(interaction, db);
      return;
    }

    if (subcommand === 'archive') {
      await archiveEvent(interaction, db);
      return;
    }

    if (subcommand === 'delete') {
      await deleteEvent(interaction, db);
      return;
    }

    if (subcommand === 'echo') {
      await echoEvent(interaction, db);
      return;
    }
  }
};
