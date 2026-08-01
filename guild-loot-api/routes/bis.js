const express = require('express');

function buildBisRoutes({ db }) {
  const router = express.Router();

  router.get('/bis-priorities/:phase', (req, res) => {
    try {
      const rows = db.prepare('SELECT item_name, spec_name, status FROM bis_priority_entries WHERE phase = ?').all(req.params.phase);
      const result = {};
      rows.forEach(row => {
        result[`${row.item_name}|${row.spec_name}`] = row.status;
      });
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/bis-priorities/:phase', (req, res) => {
    try {
      const phase = req.params.phase;
      const deletePhase = db.prepare('DELETE FROM bis_priority_entries WHERE phase = ?');
      const insertEntry = db.prepare('INSERT INTO bis_priority_entries (phase, item_name, spec_name, status) VALUES (?, ?, ?, ?)');

      const updateAll = db.transaction(() => {
        deletePhase.run(phase);
        for (const [itemKey, status] of Object.entries(req.body || {})) {
          const splitIndex = itemKey.lastIndexOf('|');
          if (splitIndex === -1 || !status) continue;
          const itemName = itemKey.slice(0, splitIndex);
          const specName = itemKey.slice(splitIndex + 1);
          insertEntry.run(phase, itemName, specName, status);
        }
      });

      updateAll();
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/bis-defaults/:phase', (req, res) => {
    try {
      const phaseMap = {
        'pre-bis': 'preraid',
        't4': 't4',
        't5': 't5',
        't6': 't6',
        'za': 'za',
        'swp': 'swp'
      };
      const phaseKey = phaseMap[String(req.params.phase || '').toLowerCase()];
      if (!phaseKey) return res.status(400).json({ error: 'Invalid phase' });

      const bisCol = `${phaseKey}_bis`;
      const optCol = `${phaseKey}_opt`;
      const rows = db.prepare(`
        SELECT i.name, s.spec,
          ib.${bisCol} as is_bis,
          ib.${optCol} as is_opt
        FROM items_bis ib
        JOIN items i ON i.id = ib.item_id
        JOIN specs s ON s.id = ib.spec_id
        WHERE ib.${bisCol} = 1 OR ib.${optCol} = 1
      `).all();

      const result = {};
      rows.forEach(row => {
        const key = `${row.name}|${row.spec}`;
        result[key] = row.is_bis ? 'BiS' : 'Opt';
      });

      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/bis', (req, res) => {
    try {
      const { spec, phase } = req.query;
      if (!spec || !phase) return res.status(400).json({ error: 'spec and phase are required' });

      const validPhases = ['preraid', 't4', 't5', 't6', 'za', 'swp'];
      const phaseKey = String(phase || '').toLowerCase().replace('-', '').replace('pre-bis', 'preraid');
      const safePhase = validPhases.includes(phaseKey) ? phaseKey : 't5';

      const rows = db.prepare(`
        SELECT
          i.id,
          i.name,
          i.slot,
          i.source,
          i.source_type,
          i.drop_chance,
          i.rarity,
          i.wowhead_id,
          ib.${safePhase}_bis as is_bis,
          ib.${safePhase}_opt as is_opt
        FROM items i
        JOIN items_bis ib ON ib.item_id = i.id
        JOIN specs s ON s.id = ib.spec_id
        WHERE s.spec = ?
          AND (ib.${safePhase}_bis = 1 OR ib.${safePhase}_opt = 1)
        ORDER BY i.slot, i.name
      `).all(spec);

      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/bis/item/:itemId', (req, res) => {
    try {
      const { phase } = req.query;
      const validPhases = ['preraid', 't4', 't5', 't6', 'za', 'swp'];
      const phaseKey = String(phase || 't5').toLowerCase().replace('-', '').replace('pre-bis', 'preraid');
      const safePhase = validPhases.includes(phaseKey) ? phaseKey : 't5';

      const rows = db.prepare(`
        SELECT
          s.spec,
          s.class,
          ib.${safePhase}_bis as is_bis,
          ib.${safePhase}_opt as is_opt
        FROM items_bis ib
        JOIN specs s ON s.id = ib.spec_id
        WHERE ib.item_id = ?
          AND (ib.${safePhase}_bis = 1 OR ib.${safePhase}_opt = 1)
        ORDER BY s.class, s.spec
      `).all(req.params.itemId);

      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/specs', (req, res) => {
    try {
      const className = req.query?.class;
      if (className) {
        const rows = db.prepare('SELECT * FROM specs WHERE class = ? ORDER BY spec').all(className);
        res.json(rows);
      } else {
        const rows = db.prepare('SELECT * FROM specs ORDER BY class, spec').all();
        res.json(rows);
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildBisRoutes;
