const {
  handleSpecSelect,
  handleClassFilterSelect,
  handleStatusButton,
  handleCharacterNameSubmit
} = require('./raidSignupHandlers');
const { buildMainSignupComponents } = require('./raidSignupComponents');
const { buildSignupEmbed, refreshEventMessage } = require('./raidSignupEmbed');
const {
  getUserPreferredCharacter,
  getAllowedSpecsForEvent,
  upsertDraft,
  upsertUserPreferredSpec
} = require('../utils/raidSignupStore');

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

function buildSpecSearchModal(eventId) {
  const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

  const specInput = new TextInputBuilder()
    .setCustomId('spec_search')
    .setLabel('Search specs')
    .setPlaceholder('Type class/spec name, e.g. Warrior Arms or Holy')
    .setRequired(true)
    .setStyle(TextInputStyle.Short);

  const row = new ActionRowBuilder().addComponents(specInput);
  return new ModalBuilder()
    .setCustomId(`rsu:specsearch:${eventId}`)
    .setTitle('Find your spec')
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

  if (interaction.isButton() && type === 'specsearch') {
    await interaction.showModal(buildSpecSearchModal(eventId));
    return true;
  }

  if (interaction.isButton() && type === 'status') {
    const status = parts[3] || '';
    return handleStatusButton(interaction, db, eventId, status);
  }

  if (interaction.isModalSubmit() && type === 'character') {
    return handleCharacterNameSubmit(interaction, db, eventId);
  }

  if (interaction.isModalSubmit() && type === 'specsearch') {
    const query = String(interaction.fields.getTextInputValue('spec_search') || '').trim();
    if (!query) {
      await interaction.reply({ content: 'Search cannot be empty.', ephemeral: true });
      return true;
    }

    const specs = getAllowedSpecsForEvent(db, eventId);
    const normalizedQuery = query.toLowerCase();
    const match = specs.find(spec => {
      const label = `${spec.class} ${spec.spec}`.toLowerCase();
      return label.includes(normalizedQuery) || String(spec.spec || '').toLowerCase().includes(normalizedQuery) || String(spec.class || '').toLowerCase().includes(normalizedQuery);
    }) || specs.find(spec => {
      const label = `${spec.class} ${spec.spec}`.toLowerCase();
      return label.startsWith(normalizedQuery);
    });

    if (!match) {
      await interaction.reply({ content: `No spec matched “${query}”. Try a class name or spec name.`, ephemeral: true });
      return true;
    }

    await interaction.reply({
      content: `Selected ${match.class} - ${match.spec}.`,
      ephemeral: true
    });

    upsertDraft(db, eventId, interaction.user.id, Number(match.id));
    upsertUserPreferredSpec(db, interaction.user.id, Number(match.id));
    await refreshEventMessage(db, interaction.client, eventId, interaction.user.id);
    return true;
  }

  return false;
}

module.exports = {
  handleRaidSignupComponent,
  buildSignupEmbed,
  buildMainSignupComponents,
  refreshEventMessage,
  buildCharacterNameModal,
  buildSpecSearchModal
};
