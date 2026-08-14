const express = require('express');

function sanitizePlanningPayload(payload) {
  const groups = Array.isArray(payload?.groups) ? payload.groups : [];
  if (!groups.length) {
    return { groups: [] };
  }

  const normalizedGroups = groups.map((group, groupIndex) => ({
    id: String(group?.id || `group-${groupIndex + 1}`),
    groupName: String(group?.groupName || `Group ${groupIndex + 1}`).slice(0, 64),
    slots: (Array.isArray(group?.slots) ? group.slots : []).slice(0, 12).map((slot, slotIndex) => ({
      id: String(slot?.id || `g${groupIndex + 1}-s${slotIndex + 1}`),
      specId: slot?.specId ? String(slot.specId) : '',
      rosterId: slot?.rosterId ? String(slot.rosterId) : '',
      note: String(slot?.note || '').slice(0, 240)
    }))
  }));

  return { groups: normalizedGroups };
}

function sanitizeRecruitmentFocusPayload(payload) {
  const focus = Array.isArray(payload?.focus) ? payload.focus : [];
  if (!focus.length) {
    return { focus: [] };
  }

  return {
    focus: focus.map((entry, entryIndex) => ({
      id: String(entry?.id || `focus-${entryIndex + 1}`),
      specId: entry?.specId ? String(entry.specId) : '',
      quantity: Number.isFinite(Number(entry?.quantity)) ? Math.max(1, Math.min(99, Number(entry.quantity))) : 1,
      publicNote: String(entry?.publicNote || '').slice(0, 500),
      officerNote: String(entry?.officerNote || '').slice(0, 500)
    }))
  };
}

function readRecruitmentPayload(db) {
  const row = db.prepare('SELECT data_json FROM recruitment_planning WHERE id = 1').get();
  if (!row?.data_json) {
    return { groups: [], focus: [] };
  }

  try {
    const parsed = JSON.parse(row.data_json);
    return {
      ...sanitizePlanningPayload(parsed),
      ...sanitizeRecruitmentFocusPayload(parsed)
    };
  } catch {
    return { groups: [], focus: [] };
  }
}

function buildRecruitmentPlanningRoutes({ db }) {
  const router = express.Router();

  router.get('/recruitment-planning', (req, res) => {
    try {
      return res.json(readRecruitmentPayload(db));
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to load recruitment planning.' });
    }
  });

  router.put('/recruitment-planning', (req, res) => {
    try {
      const existingPayload = readRecruitmentPayload(db);
      const incomingBody = req.body || {};
      const payload = {
        ...existingPayload,
        ...(Object.prototype.hasOwnProperty.call(incomingBody, 'groups') ? sanitizePlanningPayload(incomingBody) : {}),
        ...(Object.prototype.hasOwnProperty.call(incomingBody, 'focus') ? sanitizeRecruitmentFocusPayload(incomingBody) : {})
      };

      db.prepare(`
        INSERT INTO recruitment_planning (id, data_json, updated_at)
        VALUES (1, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP
      `).run(JSON.stringify(payload));

      return res.json(payload);
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to save recruitment planning.' });
    }
  });

  return router;
}

module.exports = buildRecruitmentPlanningRoutes;
