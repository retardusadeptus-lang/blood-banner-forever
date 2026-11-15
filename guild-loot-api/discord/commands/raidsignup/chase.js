const { getEventById } = require('../../utils/raidSignupStore');
const { parseScheduledUnix } = require('../../../utils/raidSignupTime');
const {
  DEFAULT_AUTOMATIC_RETRY_MS,
  DEFAULT_MANUAL_COOLDOWN_MS,
  claimChaseNotification,
  completeChaseNotification
} = require('../../utils/raidSignupChaseNotifications');

const DISCORD_USER_ID_PATTERN = /^\d{17,20}$/;
const SERVER_MESSAGE_LIMIT = 1900;

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeName(value) {
  return normalizeText(value).toLowerCase();
}

function formatNameList(names, limit = 12) {
  const uniqueNames = [...new Set(names.map(normalizeText).filter(Boolean))];
  if (uniqueNames.length <= limit) return uniqueNames.join(', ');
  return `${uniqueNames.slice(0, limit).join(', ')} and ${uniqueNames.length - limit} more`;
}

function getEventLocation(event) {
  const channelId = normalizeText(event.discord_channel_id);
  const messageId = normalizeText(event.discord_message_id);
  const guildId = normalizeText(process.env.DISCORD_GUILD_ID);

  if (guildId && channelId && messageId) {
    return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
  }
  if (channelId) return `<#${channelId}>`;
  return 'the raid signup card';
}

function getEventWhen(event) {
  const scheduledUnix = parseScheduledUnix(event.scheduled_for);
  return scheduledUnix ? `\nWhen: <t:${scheduledUnix}:F>` : '';
}

function getChaseStaleReason(event, now = Date.now()) {
  if (event.status !== 'open') return 'Only open raid signup events can be chased.';

  const scheduledUnix = parseScheduledUnix(event.scheduled_for);
  if (scheduledUnix && scheduledUnix * 1000 <= now) {
    return 'This raid signup event has already started and is stale.';
  }

  return null;
}

function findMissingSignupTargets(db, eventId) {
  const respondedRows = db.prepare(`
    SELECT discord_user_id, discord_username
    FROM raid_signup_entries
    WHERE event_id = ?
  `).all(eventId);
  const respondedIds = new Set(respondedRows.map(row => normalizeText(row.discord_user_id)).filter(Boolean));
  const respondedNames = new Set(respondedRows.map(row => normalizeName(row.discord_username)).filter(Boolean));

  const rosterRows = db.prepare(`
    SELECT id, name, discord_user_id
    FROM roster
    WHERE in_raid = 1
    ORDER BY name COLLATE NOCASE, id
  `).all();

  const targetsByDiscordId = new Map();
  const unlinkedNames = [];

  rosterRows.forEach(row => {
    const name = normalizeText(row.name);
    const discordUserId = normalizeText(row.discord_user_id);
    if (respondedIds.has(discordUserId) || (name && respondedNames.has(normalizeName(name)))) return;

    if (!discordUserId) {
      if (name) unlinkedNames.push(name);
      return;
    }

    const target = targetsByDiscordId.get(discordUserId) || {
      discordUserId,
      names: [],
      reachable: DISCORD_USER_ID_PATTERN.test(discordUserId)
    };
    if (name && !target.names.includes(name)) target.names.push(name);
    targetsByDiscordId.set(discordUserId, target);
  });

  return {
    missing: [...targetsByDiscordId.values()],
    unlinkedNames
  };
}

function buildDirectReminderMessage(event) {
  const title = normalizeText(event.title) || `Raid signup #${event.id}`;
  return `Reminder: please respond to **${title}** for raid signup #${event.id}.${getEventWhen(event)}\nPlease respond using ${getEventLocation(event)}.`;
}

function buildServerReminderMessages(event, targets) {
  const title = (normalizeText(event.title) || `Raid signup #${event.id}`).slice(0, 200);
  const prefix = `Raid signup reminder for **${title}**${getEventWhen(event)}:`;
  const suffix = ` Please respond using ${getEventLocation(event)}.`;
  const messages = [];
  let content = prefix;
  let userIds = [];

  targets.forEach(target => {
    const mention = ` <@${target.discordUserId}>`;
    if (userIds.length > 0 && `${content}${mention}${suffix}`.length > SERVER_MESSAGE_LIMIT) {
      messages.push({ content: `${content}${suffix}`, userIds });
      content = prefix;
      userIds = [];
    }
    content += mention;
    userIds.push(target.discordUserId);
  });

  if (userIds.length > 0) {
    messages.push({ content: `${content}${suffix}`, userIds });
  }

  return messages;
}

async function sendDirectReminder(client, target, content) {
  if (!client?.users || typeof client.users.fetch !== 'function') {
    return { sent: false, reason: 'Discord client is unavailable.' };
  }

  try {
    const user = await client.users.fetch(target.discordUserId);
    if (!user || typeof user.send !== 'function') {
      return { sent: false, reason: 'Discord user is not messageable.' };
    }
    await user.send({
      content,
      allowedMentions: { parse: [] }
    });
    return { sent: true };
  } catch (error) {
    console.error(`[Discord] Failed to send raid signup reminder to ${target.discordUserId}:`, error.message || error);
    return { sent: false, reason: error.message || 'Direct message failed.' };
  }
}

async function sendClaimedDirectReminder(db, event, target, content, windowKey, options) {
  const claim = claimChaseNotification(db, event.id, target.discordUserId, windowKey, options);
  if (!claim.claimed) return { sent: false, skipped: true, reason: claim.reason };

  const result = await sendDirectReminder(options.client, target, content);
  completeChaseNotification(
    db,
    event.id,
    target.discordUserId,
    windowKey,
    claim.attemptedAt,
    result
  );
  return { ...result, skipped: false };
}

async function sendServerReminder(client, event, targets) {
  const channelId = normalizeText(event.discord_channel_id);
  if (!channelId) {
    return {
      sentMessages: 0,
      failedMessages: 0,
      sentTargets: [],
      failedTargets: targets.map(target => target.discordUserId),
      reason: 'This event has no Discord channel.'
    };
  }
  if (!client?.channels || typeof client.channels.fetch !== 'function') {
    return {
      sentMessages: 0,
      failedMessages: 0,
      sentTargets: [],
      failedTargets: targets.map(target => target.discordUserId),
      reason: 'Discord client is unavailable.'
    };
  }

  let channel;
  try {
    channel = await client.channels.fetch(channelId);
  } catch (error) {
    console.error(`[Discord] Failed to fetch raid signup channel ${channelId}:`, error.message || error);
    return {
      sentMessages: 0,
      failedMessages: 0,
      sentTargets: [],
      failedTargets: targets.map(target => target.discordUserId),
      reason: 'The raid signup channel could not be fetched.'
    };
  }

  if (!channel || typeof channel.send !== 'function') {
    return {
      sentMessages: 0,
      failedMessages: 0,
      sentTargets: [],
      failedTargets: targets.map(target => target.discordUserId),
      reason: 'The raid signup channel is not messageable.'
    };
  }

  let sentMessages = 0;
  let failedMessages = 0;
  const sentTargets = [];
  const failedTargets = [];
  for (const message of buildServerReminderMessages(event, targets)) {
    try {
      await channel.send({
        content: message.content,
        allowedMentions: { users: message.userIds }
      });
      sentMessages += 1;
      sentTargets.push(...message.userIds);
    } catch (error) {
      failedMessages += 1;
      failedTargets.push(...message.userIds);
      console.error(`[Discord] Failed to send raid signup reminder in channel ${channelId}:`, error.message || error);
    }
  }

  return { sentMessages, failedMessages, sentTargets, failedTargets };
}

async function replyEphemeral(interaction, content) {
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ content });
    return;
  }
  await interaction.reply({ content, ephemeral: true });
}

async function chaseEvent(interaction, db) {
  const eventId = Number(interaction.options.getString('event', true));
  const event = getEventById(db, eventId);
  if (!event) {
    await replyEphemeral(interaction, 'Event not found.');
    return;
  }
  const staleReason = getChaseStaleReason(event);
  if (staleReason) {
    await replyEphemeral(interaction, staleReason);
    return;
  }

  const { missing, unlinkedNames } = findMissingSignupTargets(db, eventId);
  if (missing.length === 0 && unlinkedNames.length === 0) {
    await replyEphemeral(interaction, `All active roster members have responded to event #${eventId}.`);
    return;
  }

  if (typeof interaction.deferReply === 'function' && !interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: true });
  }

  const delivery = interaction.options.getString('delivery', true);
  const reachable = missing.filter(target => target.reachable);
  const unreachable = missing.filter(target => !target.reachable);
  const directMessage = buildDirectReminderMessage(event);
  const directSent = [];
  const directFailed = [];
  const directSkipped = [];
  const notificationNow = Date.now();

  if ((delivery === 'direct' || delivery === 'both') && reachable.length > 0) {
    for (const target of reachable) {
      const result = await sendClaimedDirectReminder(
        db,
        event,
        target,
        directMessage,
        'manual-direct',
        {
          client: interaction.client,
          now: notificationNow,
          retryAfterMs: DEFAULT_MANUAL_COOLDOWN_MS,
          repeatAfterSend: true
        }
      );
      if (result.sent) directSent.push(target);
      else if (result.skipped) directSkipped.push(target);
      else directFailed.push(target);
    }
  }

  const serverClaimed = [];
  const serverSkipped = [];
  if ((delivery === 'server' || delivery === 'both') && reachable.length > 0) {
    for (const target of reachable) {
      const claim = claimChaseNotification(
        db,
        event.id,
        target.discordUserId,
        'manual-server',
        {
          now: notificationNow,
          retryAfterMs: DEFAULT_MANUAL_COOLDOWN_MS,
          repeatAfterSend: true
        }
      );
      if (claim.claimed) serverClaimed.push({ target, attemptedAt: claim.attemptedAt });
      else serverSkipped.push(target);
    }
  }

  let serverResult = {
    sentMessages: 0,
    failedMessages: 0,
    sentTargets: [],
    failedTargets: []
  };
  if (serverClaimed.length > 0) {
    serverResult = await sendServerReminder(
      interaction.client,
      event,
      serverClaimed.map(entry => entry.target)
    );
    const sentTargetIds = new Set(serverResult.sentTargets);
    serverClaimed.forEach(({ target, attemptedAt }) => {
      completeChaseNotification(
        db,
        event.id,
        target.discordUserId,
        'manual-server',
        attemptedAt,
        sentTargetIds.has(target.discordUserId)
          ? { sent: true }
          : { sent: false, reason: serverResult.reason || 'Server reminder delivery failed.' }
      );
    });
  }

  const lines = [
    `Found ${missing.length} Discord-linked member${missing.length === 1 ? '' : 's'} without a response for event #${eventId}.`
  ];
  if (delivery === 'direct' || delivery === 'both') {
    lines.push(`Direct messages sent: ${directSent.length}; failed: ${directFailed.length}.`);
    if (directSkipped.length > 0) {
      lines.push(`Direct messages skipped by the 24-hour cooldown: ${directSkipped.length}.`);
    }
  }
  if (delivery === 'server' || delivery === 'both') {
    lines.push(`Server reminder messages sent: ${serverResult.sentMessages}; failed: ${serverResult.failedMessages}.`);
    if (serverResult.reason) lines.push(`Server reminder failure: ${serverResult.reason}`);
    if (serverSkipped.length > 0) {
      lines.push(`Server reminders skipped by the 24-hour cooldown: ${serverSkipped.length}.`);
    }
  }
  if (unreachable.length > 0) {
    lines.push(`Skipped members with unusable Discord IDs: ${formatNameList(unreachable.flatMap(target => target.names)) || 'unnamed roster entries'}.`);
  }
  if (unlinkedNames.length > 0) {
    lines.push(`Active roster characters without a Discord link: ${formatNameList(unlinkedNames)}.`);
  }
  if (directFailed.length > 0) {
    lines.push(`Direct-message failures: ${formatNameList(directFailed.flatMap(target => target.names)) || 'unnamed roster entries'}.`);
  }
  if (serverResult.sentMessages === 0 && directSent.length === 0) {
    lines.push('No reminder was delivered.');
  }

  await replyEphemeral(interaction, lines.join('\n'));
}

function getAutomaticWindow(event, now = Date.now()) {
  const scheduledUnix = parseScheduledUnix(event.scheduled_for);
  if (!scheduledUnix) return null;

  const hoursUntilStart = (scheduledUnix * 1000 - now) / (60 * 60 * 1000);
  if (hoursUntilStart > 8 && hoursUntilStart <= 24) return 'automatic-24h';
  if (hoursUntilStart > 0 && hoursUntilStart <= 8) return 'automatic-8h';
  return null;
}

async function runAutomaticChase({ db, client, now = Date.now() }) {
  const events = db.prepare(`
    SELECT id, title, scheduled_for, status, discord_channel_id, discord_message_id
    FROM raid_signup_events
    WHERE status = 'open'
      AND scheduled_for IS NOT NULL
      AND discord_channel_id IS NOT NULL
      AND discord_message_id IS NOT NULL
    ORDER BY scheduled_for ASC, id ASC
  `).all();

  const result = {
    eventsChecked: events.length,
    sent: 0,
    failed: 0,
    skipped: 0
  };

  for (const event of events) {
    const windowKey = getAutomaticWindow(event, now);
    if (!windowKey) continue;

    const { missing } = findMissingSignupTargets(db, event.id);
    const reachable = missing.filter(target => target.reachable);
    for (const target of reachable) {
      const notification = await sendClaimedDirectReminder(
        db,
        event,
        target,
        buildDirectReminderMessage(event),
        windowKey,
        {
          client,
          now,
          retryAfterMs: DEFAULT_AUTOMATIC_RETRY_MS,
          repeatAfterSend: false
        }
      );
      if (notification.sent) result.sent += 1;
      else if (notification.skipped) result.skipped += 1;
      else result.failed += 1;
    }
  }

  return result;
}

module.exports = {
  buildDirectReminderMessage,
  buildServerReminderMessages,
  chaseEvent,
  findMissingSignupTargets,
  formatNameList,
  getAutomaticWindow,
  getChaseStaleReason,
  runAutomaticChase,
  sendDirectReminder,
  sendServerReminder
};
