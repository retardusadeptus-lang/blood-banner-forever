const { SlashCommandBuilder } = require('discord.js');

function buildRaidsignupCommand() {
  return new SlashCommandBuilder()
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
    );
}

module.exports = {
  buildRaidsignupCommand
};
