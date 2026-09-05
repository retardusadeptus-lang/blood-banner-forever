const { getDiscordClient } = require('../bot');
const {
  listTemplates,
  createEventFromTemplate,
  getAvailableClassesForEvent,
  getAllowedSpecsForEvent
} = require('../discord/utils/raidSignupStore');
const { resolveClassEmojiToken } = require('../discord/utils/discordEmojiTokens');
const {
  parseScheduledDate,
  formatScheduleText,
  normalizeTimezone,
  DEFAULT_RAID_TIMEZONE
} = require('../utils/raidSignupTime');

function getNextRecurrenceStart(previousStart, recurrenceDays) {
  const selectedDays = [...new Set((recurrenceDays || []).map(v => Number(v)).filter(v => Number.isInteger(v) && v >= 0 && v <= 6))];
  if (selectedDays.length === 0) return null;

  for (let offset = 1; offset <= 14; offset += 1) {
    const candidate = new Date(previousStart.getTime());
    candidate.setUTCDate(candidate.getUTCDate() + offset);
    if (selectedDays.includes(candidate.getUTCDay())) return candidate;
  }

  return null;
}

function createRaidSignupCron({ db }) {
  let recurrenceTickInFlight = false;

  async function run() {
    if (recurrenceTickInFlight) return;
    recurrenceTickInFlight = true;

    try {
      const templates = listTemplates(db).filter(template => template.is_active && template.recurrence_enabled && Array.isArray(template.recurrence_days) && template.recurrence_days.length > 0);
      if (templates.length === 0) return;

      const client = getDiscordClient();
      if (!client) return;
      await client.application.emojis.fetch().catch(() => {});

      const { buildSignupEmbed, buildMainSignupComponents } = require('../discord/interactions/raidSignupInteractions');
      const now = Date.now();

      for (const template of templates) {
        const templateEvents = db.prepare(`
          SELECT id, template_id, title, description, scheduled_for, recurrence_instance, status, discord_channel_id, discord_message_id, created_at
          FROM raid_signup_events
          WHERE template_id = ?
          ORDER BY id DESC
        `).all(template.id);

        const parsedCandidates = templateEvents
          .map(event => ({ event, startedAt: parseScheduledDate(event.scheduled_for, normalizeTimezone(template.timezone || DEFAULT_RAID_TIMEZONE)) }))
          .filter(row => row.startedAt && row.event.discord_channel_id)
          .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

        const startedCandidates = parsedCandidates.filter(row => row.startedAt.getTime() <= now);
        if (startedCandidates.length === 0) continue;

        const latest = startedCandidates[0];
        const delayMs = Math.max(0, Number(template.recurrence_delay_hours || 0)) * 60 * 60 * 1000;
        if (now < latest.startedAt.getTime() + delayMs) continue;

        const nextStart = getNextRecurrenceStart(latest.startedAt, template.recurrence_days);
        if (!nextStart) continue;

        const recurrenceInstance = nextStart.toISOString();
        const alreadyExists = templateEvents.some(event => String(event.recurrence_instance || '') === recurrenceInstance);
        if (alreadyExists) {
          console.log(`[RaidSignup] Recurrence skip for template #${template.id}: recurrence instance already exists (${recurrenceInstance}).`);
          continue;
        }

        const scheduledFor = formatScheduleText(nextStart, normalizeTimezone(template.timezone || DEFAULT_RAID_TIMEZONE));
        const nextEvent = createEventFromTemplate(db, template.id, {
          title: String(template.name || latest.event.title || 'Raid Signup').trim(),
          description: String(template.description || latest.event.description || '').trim(),
          scheduledFor,
          recurrenceInstance
        });

        const channel = await client.channels.fetch(latest.event.discord_channel_id).catch(() => null);
        if (!channel || typeof channel.send !== 'function') continue;

        const classes = getAvailableClassesForEvent(db, nextEvent.id);
        const specs = getAllowedSpecsForEvent(db, nextEvent.id);
        const message = await channel.send({
          embeds: [buildSignupEmbed(nextEvent, [], client)],
          components: buildMainSignupComponents(nextEvent.id, classes, specs, '', false, '', null, client)
        });

        db.prepare(`
          UPDATE raid_signup_events
          SET discord_channel_id = ?, discord_message_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(String(channel.id), String(message.id), nextEvent.id);

        console.log(`[RaidSignup] Auto-posted recurring event #${nextEvent.id} from template #${template.id}`);
      }
    } catch (e) {
      console.error('[RaidSignup] Recurrence automation failed:', e.message || e);
    } finally {
      recurrenceTickInFlight = false;
    }
  }

  return { run };
}

module.exports = {
  createRaidSignupCron
};
