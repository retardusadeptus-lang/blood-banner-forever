const express = require('express');
const { getBattleNetSessionFromRequest, getBattleNetRoleFromRequest } = require('../middleware/auth');

const APPLICATION_FIELD_LIMITS = {
  className: 40,
  spec: 80,
  name: 80,
  aboutMe: 5000
};

function sanitizeText(value, maxLength) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!maxLength) return text;
  return text.slice(0, maxLength);
}

function titleCase(value) {
  return String(value || '').split(/\s+/).filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
}

function buildRecruitmentApplicationsRoutes({ db, sessionSecret, webhookUrl }) {
  const router = express.Router();

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

      const rows = db.prepare('SELECT id, user_id, battletag, class_name, spec, name, about_me, created_at, updated_at FROM recruitment_applications ORDER BY created_at DESC').all();
      const applications = rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        applicantBattletag: row.battletag,
        className: row.class_name,
        spec: row.spec,
        name: row.name,
        aboutMe: row.about_me,
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

  router.post('/recruitment-applications', async (req, res) => {
    try {
      const session = getBattleNetSessionFromRequest(req);
      if (!session?.userId) {
        return res.status(401).json({ error: 'Battle.net authentication required.' });
      }

      const className = sanitizeText(req.body?.className || '', APPLICATION_FIELD_LIMITS.className);
      const spec = sanitizeText(req.body?.spec || '', APPLICATION_FIELD_LIMITS.spec);
      const name = sanitizeText(req.body?.name || '', APPLICATION_FIELD_LIMITS.name);
      const aboutMe = sanitizeText(req.body?.aboutMe || '', APPLICATION_FIELD_LIMITS.aboutMe);

      if (!className || !spec || !name || !aboutMe) {
        return res.status(400).json({ error: 'Class, spec, name, and about me are all required.' });
      }

      const applicantBattletag = String(session.battletag || 'Unknown#0000').trim();
      const existing = db.prepare('SELECT id FROM recruitment_applications WHERE user_id = ?').get(session.userId);
      if (existing) {
        return res.status(409).json({ error: 'You already submitted an application. Please edit the existing application if needed.' });
      }

      const result = db.prepare(`
        INSERT INTO recruitment_applications (user_id, battletag, class_name, spec, name, about_me, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(session.userId, applicantBattletag, className, spec, name, aboutMe);

      const created = db.prepare('SELECT id, user_id, battletag, class_name, spec, name, about_me, created_at, updated_at FROM recruitment_applications WHERE id = ?').get(result.lastInsertRowid);

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
        className: created.class_name,
        spec: created.spec,
        name: created.name,
        aboutMe: created.about_me,
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
