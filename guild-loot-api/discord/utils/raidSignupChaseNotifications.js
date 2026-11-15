const DEFAULT_MANUAL_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_AUTOMATIC_RETRY_MS = 60 * 60 * 1000;

function claimChaseNotification(db, eventId, discordUserId, windowKey, options = {}) {
  const now = Number(options.now ?? Date.now());
  const retryAfterMs = Number(options.retryAfterMs ?? DEFAULT_AUTOMATIC_RETRY_MS);
  const repeatAfterSend = options.repeatAfterSend === true;

  return db.transaction(() => {
    const existing = db.prepare(`
      SELECT last_attempted_at, last_sent_at
      FROM raid_signup_chase_notifications
      WHERE event_id = ? AND discord_user_id = ? AND window_key = ?
      LIMIT 1
    `).get(eventId, discordUserId, windowKey);

    if (existing) {
      if (!repeatAfterSend && existing.last_sent_at !== null) {
        return { claimed: false, reason: 'already-sent' };
      }
      if (
        existing.last_attempted_at !== null
        && now - Number(existing.last_attempted_at) < retryAfterMs
      ) {
        return { claimed: false, reason: 'cooldown' };
      }

      db.prepare(`
        UPDATE raid_signup_chase_notifications
        SET last_attempted_at = ?, failure_reason = '', updated_at = CURRENT_TIMESTAMP
        WHERE event_id = ? AND discord_user_id = ? AND window_key = ?
      `).run(now, eventId, discordUserId, windowKey);
      return { claimed: true, attemptedAt: now };
    }

    db.prepare(`
      INSERT INTO raid_signup_chase_notifications (
        event_id, discord_user_id, window_key, last_attempted_at
      )
      VALUES (?, ?, ?, ?)
    `).run(eventId, discordUserId, windowKey, now);
    return { claimed: true, attemptedAt: now };
  })();
}

function completeChaseNotification(db, eventId, discordUserId, windowKey, attemptedAt, result) {
  const sent = result?.sent === true;
  const failureReason = sent ? '' : String(result?.reason || 'Notification delivery failed.').slice(0, 500);
  db.prepare(`
    UPDATE raid_signup_chase_notifications
    SET
      last_sent_at = CASE WHEN ? = 1 THEN ? ELSE last_sent_at END,
      failure_reason = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE event_id = ? AND discord_user_id = ? AND window_key = ? AND last_attempted_at = ?
  `).run(sent ? 1 : 0, sent ? Number(attemptedAt) : null, failureReason, eventId, discordUserId, windowKey, attemptedAt);
}

function getChaseNotification(db, eventId, discordUserId, windowKey) {
  return db.prepare(`
    SELECT event_id, discord_user_id, window_key, last_attempted_at, last_sent_at, failure_reason
    FROM raid_signup_chase_notifications
    WHERE event_id = ? AND discord_user_id = ? AND window_key = ?
    LIMIT 1
  `).get(eventId, discordUserId, windowKey);
}

module.exports = {
  DEFAULT_AUTOMATIC_RETRY_MS,
  DEFAULT_MANUAL_COOLDOWN_MS,
  claimChaseNotification,
  completeChaseNotification,
  getChaseNotification
};
