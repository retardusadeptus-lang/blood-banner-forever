const express = require('express');
const { listTemplates } = require('../../discord/utils/raidSignupStore');
const { normalizeTimezone, DEFAULT_RAID_TIMEZONE } = require('../../utils/raidSignupTime');

function buildRaidSignupTemplateRoutes({ db }) {
  const router = express.Router();

  router.get('/raid-signup-templates', (req, res) => {
    try {
      res.json(listTemplates(db));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/raid-signup-templates', (req, res) => {
    try {
      const templates = Array.isArray(req.body) ? req.body : [];
      const deleteAll = db.prepare('DELETE FROM raid_signup_templates');
      const insertTemplate = db.prepare(`
        INSERT INTO raid_signup_templates (name, description, group_size, timezone_text, starts_at_text, recurrence_rule, recurrence_days_json, recurrence_delay_hours, recurrence_enabled, allowed_spec_ids_json, is_active, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      const saveAll = db.transaction(() => {
        deleteAll.run();
        templates.forEach(template => {
          const name = String(template?.name || '').trim();
          if (!name) return;
          const allowed = Array.isArray(template.allowed_spec_ids)
            ? template.allowed_spec_ids.map(v => Number(v)).filter(Boolean)
            : [];
          const recurrenceDays = Array.isArray(template.recurrence_days)
            ? [...new Set(template.recurrence_days.map(v => Number(v)).filter(v => Number.isInteger(v) && v >= 0 && v <= 6))].sort((a, b) => a - b)
            : [];
          const parsedDelayHours = Number(template.recurrence_delay_hours);
          const recurrenceDelayHours = Number.isFinite(parsedDelayHours) ? Math.max(0, parsedDelayHours) : 2;
          const parsedGroupSize = Number(template.group_size);
          const groupSize = [10, 25, 40].includes(parsedGroupSize) ? parsedGroupSize : 25;
          const timezone = normalizeTimezone(template.timezone || template.timezone_text || DEFAULT_RAID_TIMEZONE);

          insertTemplate.run(
            name,
            String(template.description || '').trim(),
            groupSize,
            timezone,
            String(template.starts_at_text || '').trim(),
            String(template.recurrence_rule || '').trim(),
            JSON.stringify(recurrenceDays),
            recurrenceDelayHours,
            template.recurrence_enabled === true ? 1 : 0,
            JSON.stringify(allowed),
            template.is_active === false ? 0 : 1
          );
        });
      });

      saveAll();
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildRaidSignupTemplateRoutes;
