const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { enforceRoleAccess, respondRosterAutocomplete } = require('../utils/discordGuards');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('raid')
    .setDescription('Manage raid participation status')
    .addSubcommand(subcommand =>
      subcommand
        .setName('signup')
        .setDescription('Set your character to in-raid')
        .addIntegerOption(option =>
          option
            .setName('character')
            .setDescription('Character in roster')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('bench')
        .setDescription('Set your character to benched')
        .addIntegerOption(option =>
          option
            .setName('character')
            .setDescription('Character in roster')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),

  async autocomplete(interaction, { db }) {
    await respondRosterAutocomplete(interaction, db);
  },

  async execute(interaction, { db }) {
    const subcommand = interaction.options.getSubcommand();
    const hasAccess = await enforceRoleAccess(interaction, db, subcommand);
    if (!hasAccess) return;

    const characterId = interaction.options.getInteger('character', true);
    const inRaidValue = subcommand === 'signup' ? 1 : 0;

    const update = db.prepare(`
      UPDATE roster
      SET in_raid = ?
      WHERE id = ?
    `);

    const result = update.run(inRaidValue, characterId);

    if (result.changes === 0) {
      await interaction.reply({
        content: 'Selected character was not found in roster.',
        ephemeral: true
      });
      return;
    }

    const player = db.prepare('SELECT name FROM roster WHERE id = ? LIMIT 1').get(characterId);
    const characterName = player?.name || `ID ${characterId}`;

    const statusText = inRaidValue === 1 ? 'Signed up for raid' : 'Moved to bench';
    const color = inRaidValue === 1 ? 0x2ecc71 : 0xe67e22;

    const embed = new EmbedBuilder()
      .setTitle('Raid Status Updated')
      .setColor(color)
      .addFields(
        { name: 'Character', value: characterName, inline: true },
        { name: 'Status', value: statusText, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
