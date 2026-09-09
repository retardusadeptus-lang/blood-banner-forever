const express = require('express');
const { getBattleNetSessionFromRequest, getBattleNetRoleFromRequest } = require('../middleware/auth');
const { sendDirectMessage } = require('../services/discordBot');

const APPLICATION_FIELD_LIMITS = {
  className: 40,
  spec: 80,
  name: 80,
  discordId: 80,
  aboutMe: 5000
};

function sanitizeText(value, maxLength) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!maxLength) return text;
  return text.slice(0, maxLength);
}

function sanitizeRichText(value, maxLength) {
  const text = String(value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!maxLength) return text;
  return text.slice(0, maxLength);
}

function parseStatusHistory(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildStatusHistory(previousHistory, status, actorLabel, at) {
  const timestamp = at || new Date().toISOString();
  const nextHistory = Array.isArray(previousHistory) ? previousHistory.slice(-19) : [];
  nextHistory.push({ status, changedAt: timestamp, actorLabel: actorLabel || 'System' });
  return JSON.stringify(nextHistory.slice(-20));
}

function buildRecruitmentApplicationsRoutes({ db, webhookUrl }) {
  const router = express.Router();

  const notifyApplicant = async (discordId, message) => {
    if (!/^\d{17,20}$/.test(String(discordId || '').trim())) return;
    try {
      await sendDirectMessage(discordId, message);
    } catch (error) {
      console.error('Failed to send recruitment applicant Discord DM:', error.message || error);
    }
  };

  function ensureOfficer(req, res) {
    const roleInfo = getBattleNetRoleFromRequest(req, db);
    if (!roleInfo.isOfficer) {
      res.status(403).json({ error: 'Officer access required.' });
      return false;
    }
    return true;
  }

  router.get('/recruitment-applications/config', (req, res) => {
    try {
      const row = db.prepare('SELECT blurb FROM recruitment_applications_config WHERE id = 1').get();
      return res.json({ blurb: row?.blurb || '' });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to load recruitment application config.' });
    }
  });

  router.put('/recruitment-applications/config', (req, res) => {
    try {
      const blurb = sanitizeText(req.body?.blurb || '', 2000);
      db.prepare(`
        INSERT INTO recruitment_applications_config (id, blurb, updated_at)
        VALUES (1, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET blurb = excluded.blurb, updated_at = CURRENT_TIMESTAMP
      `).run(blurb);
      return res.json({ blurb });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to save recruitment application config.' });
    }
  });

  router.get('/recruitment-applications', (req, res) => {
    try {
      const session = getBattleNetSessionFromRequest(req);
      if (!session?.userId) {
        return res.status(401).json({ error: 'Battle.net authentication required.' });
      }

      const roleInfo = getBattleNetRoleFromRequest(req, db);
      const isOfficer = Boolean(roleInfo.isOfficer);

      const rows = db.prepare('SELECT id, user_id, battletag, discord_id, class_name, spec, name, about_me, is_proxy, proxy_name, proxy_battletag, status, officer_note, reviewed_by_user_id, reviewed_by_battletag, reviewed_at, status_changed_at, status_history_json, created_at, updated_at FROM recruitment_applications ORDER BY created_at DESC').all();
      const applications = rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        applicantBattletag: row.battletag,
        discordId: row.discord_id || '',
        className: row.class_name,
        spec: row.spec,
        name: row.name,
        aboutMe: row.about_me,
        isProxy: Boolean(Number(row.is_proxy || 0)),
        proxyName: row.proxy_name || '',
        proxyBattletag: row.proxy_battletag || '',
        status: row.status || 'pending',
        officerNote: row.officer_note || '',
        reviewedByUserId: row.reviewed_by_user_id || null,
        reviewedByBattletag: row.reviewed_by_battletag || null,
        reviewedAt: row.reviewed_at || null,
        statusChangedAt: row.status_changed_at || null,
        statusHistory: parseStatusHistory(row.status_history_json),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isOwner: Number(row.user_id || 0) === Number(session.userId || 0) || String(row.battletag || '').toLowerCase() === String(session.battletag || '').toLowerCase()
      }));

      const visible = isOfficer ? applications : applications.filter(app => app.isOwner);
      return res.json(visible);
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to load recruitment applications.' });
    }
  });

  router.put('/recruitment-applications/:id', async (req, res) => {
    try {
      const session = getBattleNetSessionFromRequest(req);
      if (!session?.userId) {
        return res.status(401).json({ error: 'Battle.net authentication required.' });
      }

      const applicationId = Number(req.params?.id || 0);
      if (!applicationId) {
        return res.status(400).json({ error: 'Valid application id is required.' });
      }

      const row = db.prepare('SELECT * FROM recruitment_applications WHERE id = ?').get(applicationId);
      if (!row) {
        return res.status(404).json({ error: 'Application not found.' });
      }

      const roleInfo = getBattleNetRoleFromRequest(req, db);
      const isOfficer = Boolean(roleInfo.isOfficer);
      const isOwner = Number(row.user_id || 0) === Number(session.userId || 0) || String(row.battletag || '').toLowerCase() === String(session.battletag || '').toLowerCase();

      if (!isOfficer && !isOwner) {
        return res.status(403).json({ error: 'You can only edit your own application.' });
      }

      const className = sanitizeText(req.body?.className || row.class_name, APPLICATION_FIELD_LIMITS.className);
      const spec = sanitizeText(req.body?.spec || row.spec, APPLICATION_FIELD_LIMITS.spec);
      const name = sanitizeText(req.body?.name || row.name, APPLICATION_FIELD_LIMITS.name);
      const discordId = Object.prototype.hasOwnProperty.call(req.body || {}, 'discordId')
        ? sanitizeText(req.body.discordId, APPLICATION_FIELD_LIMITS.discordId)
        : (row.discord_id || '');
      const aboutMe = sanitizeRichText(req.body?.aboutMe || row.about_me, APPLICATION_FIELD_LIMITS.aboutMe);
      const isProxy = isOfficer ? Boolean(req.body?.isProxy) : Boolean(Number(row.is_proxy || 0));
      const proxyName = isOfficer ? sanitizeText(req.body?.proxyName || row.proxy_name || '', APPLICATION_FIELD_LIMITS.name) : (row.proxy_name || '');
      const proxyBattletag = isOfficer ? sanitizeText(req.body?.proxyBattletag || row.proxy_battletag || '', APPLICATION_FIELD_LIMITS.name) : (row.proxy_battletag || '');

      if (!className || !spec || !name || !aboutMe) {
        return res.status(400).json({ error: 'Class, spec, name, and about me are all required.' });
      }

      const applicantBattletag = isProxy ? (proxyBattletag || 'Proxy#0000') : (String(session.battletag || row.battletag || 'Unknown#0000').trim());
      const updatedUserId = isProxy ? (row.user_id || null) : (Number(session.userId || row.user_id || 0) || null);

      db.prepare(`
        UPDATE recruitment_applications
        SET user_id = ?, battletag = ?, discord_id = ?, class_name = ?, spec = ?, name = ?, about_me = ?, is_proxy = ?, proxy_name = ?, proxy_battletag = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(updatedUserId, applicantBattletag, discordId, className, spec, name, aboutMe, isProxy ? 1 : 0, isProxy ? proxyName : null, isProxy ? proxyBattletag : null, applicationId);

      const updated = db.prepare('SELECT id, user_id, battletag, discord_id, class_name, spec, name, about_me, is_proxy, proxy_name, proxy_battletag, status, officer_note, reviewed_by_user_id, reviewed_by_battletag, reviewed_at, status_changed_at, status_history_json, created_at, updated_at FROM recruitment_applications WHERE id = ?').get(applicationId);
      await notifyApplicant(updated.discord_id, `Your recruitment application has been updated on the guild site. Current status: ${updated.status || 'pending'}.`);
      return res.json({
        id: updated.id,
        userId: updated.user_id,
        applicantBattletag: updated.battletag,
        discordId: updated.discord_id || '',
        className: updated.class_name,
        spec: updated.spec,
        name: updated.name,
        aboutMe: updated.about_me,
        isProxy: Boolean(Number(updated.is_proxy || 0)),
        proxyName: updated.proxy_name || '',
        proxyBattletag: updated.proxy_battletag || '',
        status: updated.status || 'pending',
        officerNote: updated.officer_note || '',
        reviewedByUserId: updated.reviewed_by_user_id || null,
        reviewedByBattletag: updated.reviewed_by_battletag || null,
        reviewedAt: updated.reviewed_at || null,
        statusChangedAt: updated.status_changed_at || null,
        statusHistory: parseStatusHistory(updated.status_history_json),
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to update recruitment application.' });
    }
  });

  router.put('/recruitment-applications/:id/status', async (req, res) => {
    try {
      const session = getBattleNetSessionFromRequest(req);
      if (!session?.userId) {
        return res.status(401).json({ error: 'Battle.net authentication required.' });
      }
      if (!ensureOfficer(req, res)) return;

      const applicationId = Number(req.params?.id || 0);
      if (!applicationId) {
        return res.status(400).json({ error: 'Valid application id is required.' });
      }

      const normalizedStatus = String(req.body?.status || '').trim().toLowerCase();
      const allowedStatuses = ['pending', 'approved', 'rejected'];
      if (!allowedStatuses.includes(normalizedStatus)) {
        return res.status(400).json({ error: 'Status must be pending, approved, or rejected.' });
      }

      const officerNote = sanitizeText(req.body?.officerNote || req.body?.note || '', 2000);
      const reviewedAt = new Date().toISOString();
      const row = db.prepare('SELECT status, status_history_json FROM recruitment_applications WHERE id = ?').get(applicationId);
      const previousStatus = row?.status || 'pending';
      const history = parseStatusHistory(row?.status_history_json);
      const updatedHistory = buildStatusHistory(history, normalizedStatus, `${session.battletag || 'Officer'} (${session.userId || 'proxy'})`, reviewedAt);

      const result = db.prepare(`
        UPDATE recruitment_applications
        SET status = ?, officer_note = ?, reviewed_by_user_id = ?, reviewed_by_battletag = ?, reviewed_at = ?, status_changed_at = ?, status_history_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(normalizedStatus, officerNote, session.userId, session.battletag || null, reviewedAt, reviewedAt, updatedHistory, applicationId);

      if (!result.changes) {
        return res.status(404).json({ error: 'Application not found.' });
      }

      const updated = db.prepare('SELECT id, user_id, battletag, discord_id, class_name, spec, name, about_me, is_proxy, proxy_name, proxy_battletag, status, officer_note, reviewed_by_user_id, reviewed_by_battletag, reviewed_at, status_changed_at, status_history_json, created_at, updated_at FROM recruitment_applications WHERE id = ?').get(applicationId);
      const noteSuffix = officerNote ? ` Officer note: ${officerNote}` : '';
      await notifyApplicant(updated.discord_id, `Your recruitment application status changed from ${previousStatus} to ${updated.status || normalizedStatus}.${noteSuffix}`);
      return res.json({
        id: updated.id,
        userId: updated.user_id,
        applicantBattletag: updated.battletag,
        discordId: updated.discord_id || '',
        className: updated.class_name,
        spec: updated.spec,
        name: updated.name,
        aboutMe: updated.about_me,
        isProxy: Boolean(Number(updated.is_proxy || 0)),
        proxyName: updated.proxy_name || '',
        proxyBattletag: updated.proxy_battletag || '',
        status: updated.status || 'pending',
        officerNote: updated.officer_note || '',
        previousStatus,
        reviewedByUserId: updated.reviewed_by_user_id || null,
        reviewedByBattletag: updated.reviewed_by_battletag || null,
        reviewedAt: updated.reviewed_at || null,
        statusChangedAt: updated.status_changed_at || null,
        statusHistory: parseStatusHistory(updated.status_history_json),
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to update recruitment application status.' });
    }
  });

  router.delete('/recruitment-applications/:id', (req, res) => {
    try {
      const session = getBattleNetSessionFromRequest(req);
      if (!session?.userId) {
        return res.status(401).json({ error: 'Battle.net authentication required.' });
      }
      if (!ensureOfficer(req, res)) return;

      const applicationId = Number(req.params?.id || 0);
      if (!applicationId) {
        return res.status(400).json({ error: 'Valid application id is required.' });
      }

      const result = db.prepare('DELETE FROM recruitment_applications WHERE id = ?').run(applicationId);
      if (!result.changes) {
        return res.status(404).json({ error: 'Application not found.' });
      }

      return res.json({ deleted: true, id: applicationId });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to delete recruitment application.' });
    }
  });

  router.post('/recruitment-applications', async (req, res) => {
    try {
      const session = getBattleNetSessionFromRequest(req);
      if (!session?.userId) {
        return res.status(401).json({ error: 'Battle.net authentication required.' });
      }

      const className = sanitizeText(req.body?.className || '', APPLICATION_FIELD_LIMITS.className);
      const spec = sanitizeText(req.body?.spec || '', APPLICATION_FIELD_LIMITS.spec);
      const name = sanitizeText(req.body?.name || '', APPLICATION_FIELD_LIMITS.name);
      const discordId = sanitizeText(req.body?.discordId || '', APPLICATION_FIELD_LIMITS.discordId);
      const aboutMe = sanitizeRichText(req.body?.aboutMe || '', APPLICATION_FIELD_LIMITS.aboutMe);

      if (!className || !spec || !name || !aboutMe) {
        return res.status(400).json({ error: 'Class, spec, name, and about me are all required.' });
      }

      const isProxyRequest = Boolean(req.body?.isProxy && getBattleNetRoleFromRequest(req, db).isOfficer);
      const proxyName = isProxyRequest ? sanitizeText(req.body?.proxyName || '', APPLICATION_FIELD_LIMITS.name) : '';
      const proxyBattletag = isProxyRequest ? sanitizeText(req.body?.proxyBattletag || '', APPLICATION_FIELD_LIMITS.name) : '';
      const applicantBattletag = isProxyRequest ? (proxyBattletag || 'Proxy#0000') : String(session.battletag || 'Unknown#0000').trim();
      const existing = isProxyRequest ? null : db.prepare('SELECT id FROM recruitment_applications WHERE user_id = ?').get(session.userId);
      if (existing) {
        return res.status(409).json({ error: 'You already submitted an application. Please edit the existing application if needed.' });
      }

      const timestamp = new Date().toISOString();
      const initialHistory = buildStatusHistory([], 'pending', isProxyRequest ? 'Proxy Application' : 'Applicant', timestamp);

      const result = db.prepare(`
        INSERT INTO recruitment_applications (user_id, battletag, discord_id, class_name, spec, name, about_me, is_proxy, proxy_name, proxy_battletag, status, officer_note, reviewed_by_user_id, reviewed_by_battletag, reviewed_at, status_changed_at, status_history_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        isProxyRequest ? null : session.userId,
        applicantBattletag,
        discordId,
        className,
        spec,
        name,
        aboutMe,
        isProxyRequest ? 1 : 0,
        isProxyRequest ? proxyName : null,
        isProxyRequest ? proxyBattletag : null,
        null,
        null,
        timestamp,
        timestamp,
        initialHistory
      );

      const created = db.prepare('SELECT id, user_id, battletag, discord_id, class_name, spec, name, about_me, is_proxy, proxy_name, proxy_battletag, status, officer_note, reviewed_by_user_id, reviewed_by_battletag, reviewed_at, status_changed_at, status_history_json, created_at, updated_at FROM recruitment_applications WHERE id = ?').get(result.lastInsertRowid);

      await notifyApplicant(created.discord_id, 'Your recruitment application has been received by the guild. We will review it and update you when its status changes.');

      if (webhookUrl) {
        try {
          const payload = {
            username: 'Recruitment Application',
            embeds: [{
              title: `📝 New recruitment application: ${name}`,
              color: 15548997,
              fields: [
                { name: 'Class', value: className, inline: true },
                { name: 'Spec', value: spec, inline: true },
                { name: 'Applicant', value: applicantBattletag, inline: true },
                ...(discordId ? [{ name: 'Discord ID', value: discordId, inline: true }] : []),
                { name: 'About Me', value: aboutMe.slice(0, 1000) }
              ],
              timestamp: new Date().toISOString()
            }]
          };

          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (error) {
          console.error('Failed to send recruitment application webhook:', error.message || error);
        }
      }

      return res.status(201).json({
        id: created.id,
        userId: created.user_id,
        applicantBattletag: created.battletag,
        discordId: created.discord_id || '',
        className: created.class_name,
        spec: created.spec,
        name: created.name,
        aboutMe: created.about_me,
        isProxy: Boolean(Number(created.is_proxy || 0)),
        proxyName: created.proxy_name || '',
        proxyBattletag: created.proxy_battletag || '',
        status: created.status || 'pending',
        officerNote: created.officer_note || '',
        reviewedByUserId: created.reviewed_by_user_id || null,
        reviewedByBattletag: created.reviewed_by_battletag || null,
        reviewedAt: created.reviewed_at || null,
        statusChangedAt: created.status_changed_at || null,
        statusHistory: parseStatusHistory(created.status_history_json),
        createdAt: created.created_at,
        updatedAt: created.updated_at
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to submit recruitment application.' });
    }
  });

  return router;
}

module.exports = buildRecruitmentApplicationsRoutes;
