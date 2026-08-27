const path = require('path');
const { config } = require('dotenv');
config({ path: path.resolve(__dirname, '..', '..', '.env') });

const { Client, GatewayIntentBits } = require('discord.js');
const { db } = require('../config/db');
const {
  getRoleBucketForSpec,
  getAllowedSpecsForEvent,
  getAvailableClassesForEvent,
  listEntriesForEvent
} = require('../discord/utils/raidSignupStore');
const {
  buildSignupEmbed,
  buildMainSignupComponents
} = require('../discord/interactions/raidSignupInteractions');

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !guildId) {
    throw new Error('DISCORD_BOT_TOKEN and DISCORD_GUILD_ID must be set.');
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers] });
  await client.login(token);

  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) {
    throw new Error(`Guild ${guildId} not found. Check DISCORD_GUILD_ID.`);
  }

  const channels = Array.from((await guild.channels.fetch()).values());
  const targetChannel = channels.find((ch) => ch.type === 0 && (
    ch.name.toLowerCase().includes('general') ||
    ch.name.toLowerCase().includes('raid') ||
    ch.name.toLowerCase().includes('signup') ||
    ch.name.toLowerCase().includes('to-do')
  )) || channels.find((ch) => ch.type === 0) || guild.systemChannel;

  if (!targetChannel) {
    throw new Error('No text channel available in this guild.');
  }

  let template = db.prepare('SELECT * FROM raid_signup_templates ORDER BY id DESC LIMIT 1').get();
  if (!template) {
    const rows = db.prepare('SELECT id, class, spec FROM specs ORDER BY class, spec LIMIT 8').all();
    const ids = rows.map((row) => row.id);
    const result = db.prepare(`
      INSERT INTO raid_signup_templates (
        name, description, group_size, timezone_text, starts_at_text,
        recurrence_rule, recurrence_days_json, recurrence_delay_hours,
        recurrence_enabled, allowed_spec_ids_json, is_active, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      'Test Raid Template',
      'Temporary test template for Discord preview.',
      25,
      'Europe/Paris',
      '2026-08-14 20:00',
      'once',
      '[]',
      2,
      0,
      JSON.stringify(ids),
      1
    );
    template = db.prepare('SELECT * FROM raid_signup_templates WHERE id = ?').get(result.lastInsertRowid);
  }

  const eventResult = db.prepare(`
    INSERT INTO raid_signup_events (
      template_id, title, description, scheduled_for, recurrence_instance,
      public_groups, status, updated_at
    ) VALUES (?, ?, ?, ?, ?, 1, 'open', CURRENT_TIMESTAMP)
  `).run(
    template.id,
    `Test Raid - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    'Live preview event with multiple signups.',
    '2026-08-14 20:00',
    'live-preview-1'
  );

  const event = db.prepare('SELECT * FROM raid_signup_events WHERE id = ?').get(eventResult.lastInsertRowid);
  const specs = getAllowedSpecsForEvent(db, event.id);
  const classes = getAvailableClassesForEvent(db, event.id);

  const statusPlan = [
    ...Array.from({ length: 25 }, (_, index) => ({ status: 'signup', label: `Signup${String(index + 1).padStart(2, '0')}` })),
    ...Array.from({ length: 3 }, (_, index) => ({ status: 'absent', label: `Absent${String(index + 1).padStart(2, '0')}` })),
    ...Array.from({ length: 3 }, (_, index) => ({ status: 'bench', label: `Bench${String(index + 1).padStart(2, '0')}` })),
    ...Array.from({ length: 2 }, (_, index) => ({ status: 'late', label: `Late${String(index + 1).padStart(2, '0')}` }))
  ];

  const sampleRows = statusPlan.map((entry, index) => {
    const spec = specs[index % specs.length] || specs[0];
    return {
      discord_user_id: `demo-${String(index + 1).padStart(3, '0')}`,
      discord_username: entry.label,
      status: entry.status,
      spec_id: spec.id
    };
  });

  sampleRows.forEach((row) => {
    const spec = db.prepare('SELECT id, class, spec, slug FROM specs WHERE id = ?').get(row.spec_id);
    const bucket = getRoleBucketForSpec(spec || { slug: '', spec: '', class: '' });
    db.prepare(`
      INSERT INTO raid_signup_entries (event_id, discord_user_id, discord_username, status, spec_id, role_bucket, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(event.id, row.discord_user_id, row.discord_username, row.status, row.spec_id, bucket);
  });

  const entries = listEntriesForEvent(db, event.id);

  const embed = buildSignupEmbed(event, entries, guild);
  const components = buildMainSignupComponents(event.id, classes, specs, '', false, 'TestHero');
  const message = await targetChannel.send({ embeds: [embed], components });

  db.prepare(`
    UPDATE raid_signup_events
    SET discord_channel_id = ?, discord_message_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(String(targetChannel.id), String(message.id), event.id);

  console.log(JSON.stringify({
    status: 'posted',
    guild: guild.name,
    channel: targetChannel.name,
    channelId: targetChannel.id,
    eventId: event.id,
    messageId: message.id,
    url: message.url
  }, null, 2));

  await client.destroy();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
