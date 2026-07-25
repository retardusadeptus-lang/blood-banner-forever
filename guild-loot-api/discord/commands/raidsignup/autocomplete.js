const { listTemplates, listManageableEvents } = require('../../utils/raidSignupStore');

async function autocomplete(interaction, db) {
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

  if (['lock', 'archive', 'delete', 'echo', 'edit'].includes(subcommand) && focused.name === 'event') {
    const events = listManageableEvents(db)
      .filter(e => `${e.id} ${e.title}`.toLowerCase().includes(String(focused.value || '').toLowerCase()))
      .slice(0, 25)
      .map(e => ({ name: `#${e.id} [${e.status}] ${e.title}`, value: String(e.id) }));

    await interaction.respond(events);
    return;
  }

  await interaction.respond([]);
}

module.exports = {
  autocomplete
};
