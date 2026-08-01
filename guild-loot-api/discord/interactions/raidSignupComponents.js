const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

function buildMainSignupComponents(eventId, classes, specs, selectedClass, disabled = false) {
  const classOptions = classes.slice(0, 25).map(className => ({
    label: className,
    value: className,
    default: String(className) === String(selectedClass || '')
  }));

  const classSelect = new StringSelectMenuBuilder()
    .setCustomId(`rsu:class:${eventId}`)
    .setPlaceholder(disabled ? 'Event is closed' : 'Filter by class')
    .setMinValues(1)
    .setMaxValues(1)
    .setDisabled(disabled)
    .addOptions(classOptions.length ? classOptions : [{ label: 'No classes configured', value: 'none' }]);

  const options = specs.slice(0, 25).map(spec => ({
    label: `${spec.class} - ${spec.spec}`,
    value: String(spec.id)
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId(`rsu:spec:${eventId}`)
    .setPlaceholder(disabled ? 'Event is closed' : 'Select your spec')
    .setMinValues(1)
    .setMaxValues(1)
    .setDisabled(disabled)
    .addOptions(options.length ? options : [{ label: 'No specs configured', value: 'none' }]);

  const statusRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`rsu:status:${eventId}:signup`).setLabel('Sign Up').setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`rsu:status:${eventId}:bench`).setLabel('Bench').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`rsu:status:${eventId}:late`).setLabel('Late').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`rsu:status:${eventId}:tentative`).setLabel('Tentative').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`rsu:status:${eventId}:absence`).setLabel('Absence').setStyle(ButtonStyle.Danger).setDisabled(disabled)
  );

  return [new ActionRowBuilder().addComponents(classSelect), new ActionRowBuilder().addComponents(select), statusRow];
}

module.exports = {
  buildMainSignupComponents
};
