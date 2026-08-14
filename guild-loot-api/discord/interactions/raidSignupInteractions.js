const {
  handleSpecSelect,
  handleClassFilterSelect,
  handleStatusButton,
  handleCharacterNameSubmit
} = require('./raidSignupHandlers');
const { buildMainSignupComponents } = require('./raidSignupComponents');
const { buildSignupEmbed, refreshEventMessage } = require('./raidSignupEmbed');
const { getUserPreferredCharacter } = require('../utils/raidSignupStore');

function buildCharacterNameModal(eventId, preferredCharacter = '') {
  const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

  const characterInput = new TextInputBuilder()
    .setCustomId('character_name')
    .setLabel('Character name')
    .setPlaceholder('Enter the name you are signing up with')
    .setRequired(true)
    .setStyle(TextInputStyle.Short)
    .setValue(String(preferredCharacter || '').trim());

  const row = new ActionRowBuilder().addComponents(characterInput);
  return new ModalBuilder()
    .setCustomId(`rsu:character:${eventId}`)
    .setTitle('Set character name')
    .addComponents(row);
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

  if (interaction.isButton() && type === 'character') {
    const preferredCharacter = String(getUserPreferredCharacter(db, interaction.user.id)?.character_name || '').trim();
    await interaction.showModal(buildCharacterNameModal(eventId, preferredCharacter));
    return true;
  }

  if (interaction.isButton() && type === 'status') {
    const status = parts[3] || '';
    return handleStatusButton(interaction, db, eventId, status);
  }

  if (interaction.isModalSubmit() && type === 'character') {
    return handleCharacterNameSubmit(interaction, db, eventId);
  }

  return false;
}

module.exports = {
  handleRaidSignupComponent,
  buildSignupEmbed,
  buildMainSignupComponents,
  refreshEventMessage,
  buildCharacterNameModal
};
