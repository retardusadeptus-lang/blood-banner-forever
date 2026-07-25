const { handleSpecSelect, handleClassFilterSelect, handleStatusButton } = require('./raidSignupHandlers');
const { buildMainSignupComponents } = require('./raidSignupComponents');
const { buildSignupEmbed, refreshEventMessage } = require('./raidSignupEmbed');

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
