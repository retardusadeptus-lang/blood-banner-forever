const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');
const { resolveClassEmojiData, resolveSpecEmojiData } = require('../utils/discordEmojiTokens');

function prioritizeSpecsForUser(specs, preferredSpecId = null, selectedClass = '') {
  const allSpecs = Array.isArray(specs) ? specs : [];
  const normalizedPreferredSpecId = Number(preferredSpecId ?? 0) || null;
  const normalizedSelectedClass = String(selectedClass || '').trim();
  const currentSpec = normalizedPreferredSpecId !== null
    ? allSpecs.find(spec => Number(spec.id) === normalizedPreferredSpecId)
    : null;
  const preferredClass = String(currentSpec?.class || normalizedSelectedClass || '').trim();

  return [...allSpecs].sort((a, b) => {
    const aIsPreferredClass = preferredClass && String(a.class || '').toLowerCase() === preferredClass.toLowerCase();
    const bIsPreferredClass = preferredClass && String(b.class || '').toLowerCase() === preferredClass.toLowerCase();

    if (aIsPreferredClass !== bIsPreferredClass) return aIsPreferredClass ? -1 : 1;

    const aIsPreferred = normalizedPreferredSpecId !== null && Number(a.id) === normalizedPreferredSpecId;
    const bIsPreferred = normalizedPreferredSpecId !== null && Number(b.id) === normalizedPreferredSpecId;
    if (aIsPreferred !== bIsPreferred) return aIsPreferred ? -1 : 1;

    return String(a.class || '').localeCompare(String(b.class || '')) || String(a.spec || '').localeCompare(String(b.spec || ''));
  });
}

function buildMainSignupComponents(eventId, classes, specs, selectedClass, disabled = false, preferredCharacter = '', preferredSpecId = null, guildOrClient = null) {
  const allSpecs = Array.isArray(specs) ? specs : [];
  const allClasses = Array.isArray(classes) ? classes : [];
  const normalizedSelectedClass = String(selectedClass || '').trim();
  const normalizedPreferredSpecId = Number(preferredSpecId ?? 0) || null;
  const classOptions = allClasses.length
    ? allClasses.map(className => {
        const cleanedClassName = String(className || '').trim();
        const classEmoji = resolveClassEmojiData(guildOrClient, cleanedClassName);
        return {
          label: cleanedClassName,
          value: cleanedClassName,
          emoji: classEmoji || undefined,
          default: Boolean(normalizedSelectedClass && cleanedClassName.toLowerCase() === normalizedSelectedClass.toLowerCase())
        };
      })
    : [{ label: 'No classes configured', value: 'none', default: false }];

  const classSelect = new StringSelectMenuBuilder()
    .setCustomId(`rsu:class:${eventId}`)
    .setPlaceholder(disabled ? 'Event is closed' : 'Select your class')
    .setMinValues(1)
    .setMaxValues(1)
    .setDisabled(disabled)
    .addOptions(classOptions);

  const currentClassSpecs = normalizedSelectedClass
    ? allSpecs.filter(spec => String(spec.class || '').trim().toLowerCase() === normalizedSelectedClass.toLowerCase())
    : allSpecs;

  const prioritizedSpecs = prioritizeSpecsForUser(currentClassSpecs, normalizedPreferredSpecId, normalizedSelectedClass);
  const specOptions = prioritizedSpecs.slice(0, 25).map(spec => ({
    label: `${spec.class} - ${spec.spec}`.trim(),
    value: String(spec.id),
    emoji: resolveSpecEmojiData(null, spec.spec, spec.class) || undefined,
    default: normalizedPreferredSpecId !== null && Number(spec.id) === normalizedPreferredSpecId
  }));

  const specSelect = new StringSelectMenuBuilder()
    .setCustomId(`rsu:spec:${eventId}`)
    .setPlaceholder(disabled ? 'Event is closed' : 'Select your spec')
    .setMinValues(1)
    .setMaxValues(1)
    .setDisabled(disabled)
    .addOptions(specOptions.length ? specOptions : [{ label: 'No specs configured', value: 'none', default: false }]);

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

  return [characterRow, new ActionRowBuilder().addComponents(classSelect), new ActionRowBuilder().addComponents(specSelect), statusRow];
}

module.exports = {
  buildMainSignupComponents,
  prioritizeSpecsForUser
};
