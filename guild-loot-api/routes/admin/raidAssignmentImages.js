const express = require('express');

function buildAdminRaidAssignmentImagesRoutes({ db }) {
  const router = express.Router();

  router.get('/raid-assignment-images', (req, res) => {
    try {
      const rows = db.prepare('SELECT id, boss_name, caption, image_data, created_at FROM raid_assignment_images ORDER BY created_at ASC').all();
      const mapped = rows.map(row => {
        const isUrl = typeof row.image_data === 'string' && /^https?:\/\//i.test(row.image_data);
        return { ...row, image_url: isUrl ? row.image_data : null };
      });
      res.json(mapped);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/raid-assignment-images/url', (req, res) => {
    try {
      const { boss_name, caption, image_url } = req.body;
      if (!boss_name || !image_url) return res.status(400).json({ error: 'boss_name and image_url are required' });

      const result = db.prepare('INSERT INTO raid_assignment_images (boss_name, caption, image_data) VALUES (?, ?, ?)').run(boss_name, caption || '', image_url);
      res.json({ id: result.lastInsertRowid, boss_name, caption: caption || '', image_url });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/raid-assignment-images', (req, res) => {
    try {
      const { boss_name, caption, image_data } = req.body;
      if (!boss_name || !image_data) return res.status(400).json({ error: 'boss_name and image_data are required' });
      const result = db.prepare('INSERT INTO raid_assignment_images (boss_name, caption, image_data) VALUES (?, ?, ?)').run(boss_name, caption || '', image_data);
      res.json({ id: result.lastInsertRowid, boss_name, caption: caption || '', image_data });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete('/raid-assignment-images/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM raid_assignment_images WHERE id = ?').run(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildAdminRaidAssignmentImagesRoutes;
