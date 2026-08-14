const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');
const { resolveSpecEmojiData } = require('../utils/discordEmojiTokens');

function classEmojiLabel(className) {
  const labels = {
    warrior: '🛡️',
    paladin: '🔨',
    hunter: '🏹',
    rogue: '🗡️',
    priest: '✨',
    shaman: '⚡',
    mage: '❄️',
    warlock: '🔥',
    druid: '🌙'
  };
  const key = String(className || '').toLowerCase();
  return labels[key] || '';
}

function buildMainSignupComponents(eventId, classes, specs, selectedClass, disabled = false, preferredCharacter = '', preferredSpecId = null) {
  const normalizedPreferredSpecId = Number(preferredSpecId ?? 0) || null;
  const options = specs.slice(0, 25).map(spec => ({
    label: `${spec.class} - ${spec.spec}`.trim(),
    value: String(spec.id),
    emoji: resolveSpecEmojiData(null, spec.spec, spec.class) || undefined,
    default: normalizedPreferredSpecId !== null && Number(spec.id) === normalizedPreferredSpecId
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId(`rsu:spec:${eventId}`)
    .setPlaceholder(disabled ? 'Event is closed' : 'Select your spec')
    .setMinValues(1)
    .setMaxValues(1)
    .setDisabled(disabled)
    .addOptions(options.length ? options : [{ label: 'No specs configured', value: 'none', default: false }]);

  const normalizedCharacter = String(preferredCharacter || '').trim();
  const sanitizedCharacter = normalizedCharacter && normalizedCharacter.toLowerCase() !== 'testhero' ? normalizedCharacter : '';
  const hasCharacterName = Boolean(sanitizedCharacter);
  const characterNameLabel = hasCharacterName ? `Character Name: ${sanitizedCharacter}` : 'Enter Character Name';
  const characterButtonStyle = hasCharacterName ? ButtonStyle.Success : ButtonStyle.Primary;
  const characterButtonEmoji = hasCharacterName ? '✅' : '⚠️';
  const characterRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`rsu:character:${eventId}`)
      .setLabel(characterNameLabel)
      .setStyle(characterButtonStyle)
      .setEmoji(characterButtonEmoji)
      .setDisabled(disabled)
  );

  const statusRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`rsu:status:${eventId}:signup`).setLabel('Sign Up').setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`rsu:status:${eventId}:bench`).setLabel('Bench').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`rsu:status:${eventId}:late`).setLabel('Late').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`rsu:status:${eventId}:tentative`).setLabel('Tentative').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`rsu:status:${eventId}:absence`).setLabel('Absence').setStyle(ButtonStyle.Danger).setDisabled(disabled)
  );

  return [characterRow, new ActionRowBuilder().addComponents(select), statusRow];
}

module.exports = {
  buildMainSignupComponents
};
