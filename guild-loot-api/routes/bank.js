const express = require('express');
const crypto = require('crypto');
const { getBattleNetSessionFromRequest } = require('../middleware/auth');
const MAX_BASKET_ITEMS = 5;

function buildBankRoutes({ db, discordService }) {
  const router = express.Router();
  const { sendBankInventoryWebhook, sendBankBulkResolutionWebhook, sendBankResolutionWebhook } = discordService;

  function generateRequestGroupId() {
    if (typeof crypto?.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `grp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  router.get('/bank-items', (req, res) => {
    try {
      const rows = db.prepare('SELECT * FROM bank_items ORDER BY category, name').all();
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/bank-items', async (req, res) => {
    try {
      const items = req.body;

      db.prepare('DELETE FROM bank_items').run();
      const insert = db.prepare(`
        INSERT INTO bank_items (item_wowhead_id, name, category, count, sub_type)
        VALUES (?, ?, ?, ?, ?)
      `);

      const insertAll = db.transaction(() => {
        items.forEach(item => {
          insert.run(item.item_wowhead_id, item.name, item.category, item.count, item.sub_type || '');
        });
      });
      insertAll();

      db.prepare('INSERT INTO bank_uploads (item_count) VALUES (?)').run(items.length);
      await sendBankInventoryWebhook(items);
      res.json({ ok: true, count: items.length });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/bank-requests', (req, res) => {
    try {
      const { status } = req.query;
      let sql = 'SELECT * FROM bank_requests';
      const params = [];
      if (status) {
        sql += ' WHERE status = ?';
        params.push(status);
      }
      sql += ' ORDER BY created_at DESC';
      const rows = db.prepare(sql).all(...params);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/bank-requests', async (req, res) => {
    try {
      const {
        player_id,
        item_wowhead_id,
        item_name,
        quantity,
        reason,
        basket_items,
        request_group_id,
        requester_discord_user_id,
        requester_discord_username
      } = req.body;

      const hasDiscordRequester = Boolean(
        requester_discord_user_id
        || requester_discord_username
        || (Array.isArray(basket_items) && basket_items.some(item => item?.requester_discord_user_id || item?.requester_discord_username))
      );

      if (!hasDiscordRequester) {
        const bnetSession = getBattleNetSessionFromRequest(req);
        if (!bnetSession?.userId) {
          return res.status(401).json({ error: 'Battle.net authentication required for website bank requests.' });
        }
      }

      const insert = db.prepare(`
        INSERT INTO bank_requests (
          player_id,
          item_wowhead_id,
          item_name,
          quantity,
          reason,
          status,
          request_group_id,
          requester_name,
          requester_discord_user_id,
          requester_discord_username
        )
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
      `);

      if (Array.isArray(basket_items) && basket_items.length > 0) {
        if (basket_items.length > MAX_BASKET_ITEMS) {
          return res.status(400).json({ error: `Basket limit is ${MAX_BASKET_ITEMS} items.` });
        }

        const groupId = request_group_id || generateRequestGroupId();
        const createdIds = [];

        const insertAll = db.transaction(() => {
          basket_items.forEach(item => {
            const info = insert.run(
              item.player_id,
              item.item_wowhead_id || 0,
              item.item_name,
              item.quantity || 1,
              item.reason || '',
              groupId,
              item.player_name || null,
              item.requester_discord_user_id || requester_discord_user_id || null,
              item.requester_discord_username || requester_discord_username || null
            );
            createdIds.push(info.lastInsertRowid);
          });
        });

        insertAll();
        return res.json({ ok: true, group_id: groupId, ids: createdIds, count: createdIds.length });
      }

      const result = insert.run(
        player_id,
        item_wowhead_id || 0,
        item_name,
        quantity || 1,
        reason || '',
        request_group_id || null,
        null,
        requester_discord_user_id || null,
        requester_discord_username || null
      );

      res.json({ ok: true, id: result.lastInsertRowid });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/bank-requests/bulk-resolve', async (req, res) => {
    try {
      const resolutions = Array.isArray(req.body?.resolutions) ? req.body.resolutions : [];
      if (resolutions.length === 0) return res.status(400).json({ error: 'No resolutions provided' });

      const update = db.prepare(`
        UPDATE bank_requests
        SET status = ?, price = ?, officer_note = ?, approved_quantity = ?, resolved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      const getRequest = db.prepare('SELECT * FROM bank_requests WHERE id = ?');
      const getPlayer = db.prepare('SELECT name FROM roster WHERE id = ?');
      const groupsByPlayer = new Map();
      const mentions = [];

      const applyAll = db.transaction(() => {
        resolutions.forEach(r => {
          update.run(r.status, r.price || null, r.note || '', r.quantity || null, r.id);
          const request = getRequest.get(r.id);
          if (!request) return;

          if (request.requester_discord_user_id) {
            mentions.push(String(request.requester_discord_user_id));
          }

          const player = getPlayer.get(request.player_id);
          const playerName = player?.name || request.requester_name || 'Unknown';
          if (!groupsByPlayer.has(playerName)) {
            groupsByPlayer.set(playerName, { playerName, entries: [] });
          }

          const group = groupsByPlayer.get(playerName);
          const isApproved = String(r.status || '').toLowerCase() === 'approved';
          const approvedQuantity = isApproved ? Number(r.quantity || request.quantity || 0) : 0;
          const requestedQuantity = Number(request.quantity || 0);
          const statusIcon = isApproved ? (approvedQuantity < requestedQuantity ? '⚠️' : '✅') : '❌';
          const priceText = isApproved && r.price ? `${r.price}g` : '';
          const noteText = r.note ? String(r.note) : '';

          group.entries.push({
            statusIcon,
            itemName: request.item_name,
            approvedQuantity,
            requestedQuantity,
            priceText,
            noteText
          });
        });
      });

      applyAll();
      const groups = Array.from(groupsByPlayer.values());
      if (groups.length > 0) {
        await sendBankBulkResolutionWebhook({ groups, mentions });
      }

      res.json({ ok: true, count: resolutions.length });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/bank-requests/:id', async (req, res) => {
    try {
      const { status, price, officer_note, approved_quantity } = req.body;
      const requestId = req.params.id;
      const getRequest = db.prepare('SELECT * FROM bank_requests WHERE id = ?');
      const getPlayer = db.prepare('SELECT name FROM roster WHERE id = ?');

      db.prepare(`
        UPDATE bank_requests
        SET status = ?, price = ?, officer_note = ?, approved_quantity = ?, resolved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, price || null, officer_note || '', approved_quantity || null, requestId);

      const request = getRequest.get(requestId);
      if (request) {
        const player = getPlayer.get(request.player_id);
        const playerName = player?.name || request.requester_name || 'Unknown';
        await sendBankResolutionWebhook({
          player_name: playerName,
          item_name: request.item_name,
          quantity: request.quantity,
          status,
          price,
          officer_note,
          approved_quantity,
          requester_discord_user_id: request.requester_discord_user_id
        });
      }

      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildBankRoutes;
