const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const { handleRaidSignupComponent } = require('./discord/interactions/raidSignupInteractions');

let activeDiscordClient = null;

function loadCommands(commandsDir) {
  const commandFiles = fs
    .readdirSync(commandsDir)
    .filter(file => file.endsWith('.js'));

  const commands = new Collection();
  const commandData = [];

  for (const file of commandFiles) {
    const fullPath = path.join(commandsDir, file);
    const command = require(fullPath);

    if (!command?.data || typeof command.execute !== 'function') {
      console.warn(`[Discord] Skipping invalid command file: ${file}`);
      continue;
    }

    commands.set(command.data.name, command);
    commandData.push(command.data.toJSON());
  }

  return { commands, commandData };
}

async function registerSlashCommands({ clientId, token, commands }) {
  const rest = new REST({ version: '10' }).setToken(token);
  const guildId = process.env.DISCORD_GUILD_ID;

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands
    });
    // Prevent duplicate command entries by clearing old global registrations
    // when operating in guild-scoped mode.
    try {
      await rest.put(Routes.applicationCommands(clientId), { body: [] });
    } catch (error) {
      console.warn('[Discord] Could not clear global commands:', error.message || error);
    }
    console.log(`[Discord] Registered ${commands.length} guild command(s) for guild ${guildId}.`);
    return;
  }

  await rest.put(Routes.applicationCommands(clientId), {
    body: commands
  });
  console.log(`[Discord] Registered ${commands.length} global command(s).`);
}

function initDiscordBot({ db }) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    console.warn('[Discord] DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID is missing. Bot startup skipped.');
    return null;
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });
  activeDiscordClient = client;

  const commandsDir = path.join(__dirname, 'discord', 'commands');
  const { commands, commandData } = loadCommands(commandsDir);
  client.commands = commands;

  client.once('clientReady', async readyClient => {
    try {
      await registerSlashCommands({ clientId, token, commands: commandData });
      console.log(`[Discord] Logged in as ${readyClient.user.tag}`);
    } catch (error) {
      console.error('[Discord] Failed during ready/init:', error);
    }
  });

  client.on('interactionCreate', async interaction => {
    try {
      if (interaction.isStringSelectMenu() || interaction.isButton()) {
        const handled = await handleRaidSignupComponent(interaction, { db });
        if (handled) return;
      }

      if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.autocomplete) {
          await command.autocomplete(interaction, { db });
        }
        return;
      }

      if (!interaction.isChatInputCommand()) return;

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction, { db });
    } catch (error) {
      console.error('[Discord] Interaction handler error:', error);

      const content = 'There was an error while executing this command.';
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content, ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ content, ephemeral: true }).catch(() => {});
      }
    }
  });

  client.login(token).catch(error => {
    console.error('[Discord] Login failed:', error);
  });

  return client;
}

module.exports = {
  initDiscordBot,
  getDiscordClient: () => activeDiscordClient
};
