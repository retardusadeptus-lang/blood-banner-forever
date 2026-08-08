const express = require('express');

function buildItemRoutes({ db, tokenRedemptionService }) {
  const router = express.Router();
  const { getTokenRedemptionByItemId } = tokenRedemptionService;

  router.get('/items', (req, res) => {
    try {
      const rows = db.prepare('SELECT * FROM items ORDER BY name').all();
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/items/:id', (req, res) => {
    try {
      const row = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
      if (!row) return res.status(404).json({ error: 'Item not found' });
      res.json(row);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/items', (req, res) => {
    try {
      const body = req.body || {};
      const sourceValue = body.source ?? body.zone ?? '';
      const sourceTypeValue = body.source_type ?? body.boss ?? '';
      const result = db.prepare(`
        INSERT INTO items (name, slot, phase, source, source_type, wowhead_id, drop_chance, rarity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        String(body.name || '').trim(),
        String(body.slot || '').trim(),
        String(body.phase || '').trim(),
        String(sourceValue || '').trim(),
        String(sourceTypeValue || '').trim(),
        body.itemId ?? body.wowhead_id ?? null,
        body.drop_chance || null,
        body.rarity || null
      );
      res.json({ ok: true, id: result.lastInsertRowid });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/items/:id', (req, res) => {
    try {
      const body = req.body || {};
      const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Item not found' });

      const sourceValue = body.source !== undefined ? body.source : existing.source ?? '';
      const sourceTypeValue = body.source_type !== undefined ? body.source_type : existing.source_type ?? '';
      const wowheadIdValue = body.itemId !== undefined ? body.itemId : (body.wowhead_id !== undefined ? body.wowhead_id : existing.wowhead_id ?? null);

      db.prepare(`
        UPDATE items
        SET name = ?, slot = ?, phase = ?, source = ?, source_type = ?, wowhead_id = ?, drop_chance = ?, rarity = ?
        WHERE id = ?
      `).run(
        String(body.name !== undefined ? body.name : existing.name).trim(),
        String(body.slot !== undefined ? body.slot : existing.slot ?? '').trim(),
        String(body.phase !== undefined ? body.phase : existing.phase ?? '').trim(),
        String(sourceValue || '').trim(),
        String(sourceTypeValue || '').trim(),
        wowheadIdValue || null,
        body.drop_chance !== undefined ? body.drop_chance : existing.drop_chance ?? null,
        body.rarity !== undefined ? body.rarity : existing.rarity ?? null,
        req.params.id
      );
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete('/items/:id', (req, res) => {
    try {
      const deleteAll = db.transaction(() => {
        db.prepare('DELETE FROM items_bis WHERE item_id = ?').run(req.params.id);
        db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
      });
      deleteAll();
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/token-redemptions/:itemId', (req, res) => {
    try {
      const redemption = getTokenRedemptionByItemId(req.params.itemId);
      if (!redemption) return res.status(404).json({ error: 'Redemption information not found for item' });
      res.json(redemption);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildItemRoutes;
