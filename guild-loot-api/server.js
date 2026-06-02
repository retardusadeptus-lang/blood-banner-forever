const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database('C:/Users/Steve/Projects/wow-loot-dashboard/guild-loot-api/mydb.db');
db.pragma('foreign_keys = ON');

// ==========================================
// ROSTER
// ==========================================
app.get('/api/roster', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, name, spec_id, in_raid FROM roster').all();
    const roster = rows.map(r => ({ ...r, in_raid: r.in_raid === 1 }));
    res.json(roster);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/roster', (req, res) => {
  try {
    const players = req.body;
    db.prepare('DELETE FROM roster').run();
    const insert = db.prepare('INSERT INTO roster (name, spec_id, in_raid) VALUES (?, ?, ?)');
    
    const updatedRosters = players.map(p => {
      const info = insert.run(p.name, p.spec_id, p.in_raid ? 1 : 0);
      return { id: info.lastInsertRowid, name: p.name, spec_id: p.spec_id, in_raid: p.in_raid };
    });
    
    res.json(updatedRosters);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// ASSIGNMENTS
// ==========================================
app.get('/api/assignments/:phase', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT item_name, player_id, rank, is_pass
      FROM assignments
      WHERE phase = ?
    `).all(req.params.phase);

    const result = {};
    rows.forEach(row => {
      if (!result[row.item_name]) result[row.item_name] = {};
      result[row.item_name][row.player_id] = row.is_pass ? 'Pass' : row.rank;
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/assignments/:phase', (req, res) => {
  try {
    const phase = req.params.phase;
    const assignments = req.body;

    const upsert = db.prepare(`
      INSERT INTO assignments (phase, item_name, player_id, rank, is_pass)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(phase, item_name, player_id)
      DO UPDATE SET rank = excluded.rank, is_pass = excluded.is_pass
    `);

    const remove = db.prepare(`
      DELETE FROM assignments
      WHERE phase = ? AND item_name = ? AND player_id = ?
    `);

    const updateAll = db.transaction(() => {
      for (const [itemName, players] of Object.entries(assignments)) {
        for (const [playerId, value] of Object.entries(players)) {
          if (value === null || value === undefined) {
            remove.run(phase, itemName, playerId);
          } else if (value === 'Pass') {
            upsert.run(phase, itemName, parseInt(playerId), null, 1);
          } else {
            upsert.run(phase, itemName, parseInt(playerId), value, 0);
          }
        }
      }
    });

    updateAll();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// BIS PRIORITIES (phase-specific)
// ==========================================
app.get('/api/bis-priorities/:phase', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM bis_priorities WHERE phase = ?').get(req.params.phase);
    res.json(row ? JSON.parse(row.data) : {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/bis-priorities/:phase', (req, res) => {
  try {
    const exists = db.prepare('SELECT id FROM bis_priorities WHERE phase = ?').get(req.params.phase);
    if (exists) {
      db.prepare('UPDATE bis_priorities SET data = ? WHERE phase = ?').run(JSON.stringify(req.body), req.params.phase);
    } else {
      db.prepare('INSERT INTO bis_priorities (phase, data) VALUES (?, ?)').run(req.params.phase, JSON.stringify(req.body));
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// PLAYER STATS
// ==========================================
app.get('/api/player-stats', (req, res) => {
  try {
    const stats = db.prepare('SELECT * FROM player_stats').all();
    const parses = db.prepare('SELECT * FROM player_parses').all();

    const result = {};

    stats.forEach(row => {
      result[row.player_id] = {
        cons: row.consumables === 1,
        enchants: row.enchants === 1,
        gems: row.gems === 1,
        afks: row.afks,
        manualAdjustment: {
          value: row.manual_adjustment || 0,
          note: row.manual_adjustment_note || ''
        },
        parses: {}
      };
    });

    parses.forEach(row => {
      if (!result[row.player_id]) {
        result[row.player_id] = {
          cons: false,
          enchants: false,
          gems: false,
          afks: 0,
          manualAdjustment: { value: 0, note: '' },
          parses: {}
        };
      }
      result[row.player_id].parses[row.boss_name] = {
        val: row.parse_value,
        support: row.is_support === 1
      };
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/player-stats', (req, res) => {
  try {
    const allStats = req.body;

    const upsertStats = db.prepare(`
      INSERT INTO player_stats (player_id, consumables, enchants, gems, afks, manual_adjustment, manual_adjustment_note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(player_id)
      DO UPDATE SET
        consumables = excluded.consumables,
        enchants = excluded.enchants,
        gems = excluded.gems,
        afks = excluded.afks,
        manual_adjustment = excluded.manual_adjustment,
        manual_adjustment_note = excluded.manual_adjustment_note
    `);

    const upsertParse = db.prepare(`
      INSERT INTO player_parses (player_id, boss_name, parse_value, is_support)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(player_id, boss_name)
      DO UPDATE SET parse_value = excluded.parse_value, is_support = excluded.is_support
    `);

    const updateAll = db.transaction(() => {
      for (const [playerId, stats] of Object.entries(allStats)) {
        upsertStats.run(
          parseInt(playerId),
          stats.cons ? 1 : 0,
          stats.enchants ? 1 : 0,
          stats.gems ? 1 : 0,
          stats.afks || 0,
          stats.manualAdjustment?.value || 0,
          stats.manualAdjustment?.note || ''
        );

        if (stats.parses) {
          for (const [bossName, parseData] of Object.entries(stats.parses)) {
            if (parseData && parseData.val !== undefined && parseData.val !== '') {
              upsertParse.run(
                parseInt(playerId),
                bossName,
                parseData.val,
                parseData.support ? 1 : 0
              );
            }
          }
        }
      }
    });

    updateAll();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// RAID LOGS
// ==========================================
app.get('/api/raid-logs', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM raid_logs ORDER BY raid_date DESC').all();
    const attendees = db.prepare('SELECT * FROM raid_attendees').all();

    const result = logs.map(log => ({
      id: log.id,
      date: log.raid_date,
      zone: log.zone,
      attendees: attendees
        .filter(a => a.raid_id === log.id)
        .map(a => a.player_id)
    }));

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/raid-logs', (req, res) => {
  try {
    const logs = req.body;

    const deleteAttendees = db.prepare('DELETE FROM raid_attendees WHERE raid_id = ?');
    const deleteLogs = db.prepare('DELETE FROM raid_logs WHERE id NOT IN (SELECT value FROM json_each(?))');
    const upsertLog = db.prepare(`
      INSERT INTO raid_logs (id, raid_date, zone)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET raid_date = excluded.raid_date, zone = excluded.zone
    `);
    const insertAttendee = db.prepare(`
      INSERT OR IGNORE INTO raid_attendees (raid_id, player_id) VALUES (?, ?)
    `);

    const updateAll = db.transaction(() => {
      const ids = logs.map(l => l.id);
      deleteLogs.run(JSON.stringify(ids));

      for (const log of logs) {
        upsertLog.run(log.id, log.date, log.zone);
        deleteAttendees.run(log.id);
        (log.attendees || []).forEach(playerId => {
          insertAttendee.run(log.id, playerId);
        });
      }
    });

    updateAll();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// ATTENDANCE
// ==========================================
app.get('/api/attendance/:playerId', (req, res) => {
  try {
    const totalRaids = db.prepare('SELECT COUNT(*) as count FROM raid_logs').get().count;
    const attended = db.prepare(`
      SELECT COUNT(*) as count FROM raid_attendees WHERE player_id = ?
    `).get(req.params.playerId).count;

    res.json({
      player_id: parseInt(req.params.playerId),
      attended,
      total: totalRaids,
      percentage: totalRaids > 0 ? Math.round((attended / totalRaids) * 100) : 100
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// SCORING CONFIG
// ==========================================
app.get('/api/scoring-config', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM scoring_config WHERE id = 1').get();
    res.json(row ? JSON.parse(row.data) : {
      parseWeight: 1,
      supportMulti: 1.5,
      consBonus: 10,
      enchantBonus: 10,
      gemBonus: 10,
      attWeight: 0.5,
      afkPenalty: 5
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/scoring-config', (req, res) => {
  try {
    const exists = db.prepare('SELECT id FROM scoring_config WHERE id = 1').get();
    if (exists) {
      db.prepare('UPDATE scoring_config SET data = ? WHERE id = 1').run(JSON.stringify(req.body));
    } else {
      db.prepare('INSERT INTO scoring_config (id, data) VALUES (1, ?)').run(JSON.stringify(req.body));
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// MUTABLE ITEMS
// ==========================================
app.get('/api/mutable-items', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM mutable_items WHERE id = 1').get();
    res.json(row ? JSON.parse(row.data) : []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/mutable-items', (req, res) => {
  try {
    const exists = db.prepare('SELECT id FROM mutable_items WHERE id = 1').get();
    if (exists) {
      db.prepare('UPDATE mutable_items SET data = ? WHERE id = 1').run(JSON.stringify(req.body));
    } else {
      db.prepare('INSERT INTO mutable_items (id, data) VALUES (1, ?)').run(JSON.stringify(req.body));
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// ITEMS
// ==========================================
app.get('/api/items', (req, res) => {
  try {
    const { phase, spec, slot } = req.query;

    let sql = `
      SELECT DISTINCT
        i.id,
        i.name,
        i.slot,
        i.source,
        i.source_type,
        i.drop_chance,
        i.rarity,
        i.wowhead_id
      FROM items i
    `;

    const params = [];
    const joins = [];
    const wheres = [];

    if (phase || spec) {
      joins.push('JOIN items_bis ib ON ib.item_id = i.id');
      joins.push('JOIN specs s ON s.id = ib.spec_id');
    }

    if (phase) {
      const validPhases = ['preraid', 't4', 't5', 't6', 'za', 'swp'];
      const phaseKey = phase.toLowerCase().replace('-', '').replace('pre-bis', 'preraid');
      const safePhase = validPhases.includes(phaseKey) ? phaseKey : 't5';
      wheres.push(`(ib.${safePhase}_bis = 1 OR ib.${safePhase}_opt = 1)`);
    }

    if (spec) {
      wheres.push('s.spec = ?');
      params.push(spec);
    }

    if (slot) {
      wheres.push('i.slot = ?');
      params.push(slot);
    }

    if (joins.length) sql += ' ' + joins.join(' ');
    if (wheres.length) sql += ' WHERE ' + wheres.join(' AND ');
    sql += ' ORDER BY i.name';

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/items/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const bisRows = db.prepare(`
      SELECT
        s.spec,
        s.class,
        ib.preraid_bis, ib.t4_bis, ib.t5_bis, ib.t6_bis, ib.za_bis, ib.swp_bis,
        ib.preraid_opt, ib.t4_opt, ib.t5_opt, ib.t6_opt, ib.za_opt, ib.swp_opt
      FROM items_bis ib
      JOIN specs s ON s.id = ib.spec_id
      WHERE ib.item_id = ?
      ORDER BY s.class, s.spec
    `).all(req.params.id);

    res.json({ ...item, bis: bisRows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// BiS
// ==========================================
app.get('/api/bis', (req, res) => {
  try {
    const { spec, phase } = req.query;
    if (!spec || !phase) return res.status(400).json({ error: 'spec and phase are required' });

    const validPhases = ['preraid', 't4', 't5', 't6', 'za', 'swp'];
    const phaseKey = phase.toLowerCase().replace('-', '').replace('pre-bis', 'preraid');
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

app.get('/api/bis/item/:itemId', (req, res) => {
  try {
    const { phase } = req.query;
    const validPhases = ['preraid', 't4', 't5', 't6', 'za', 'swp'];
    const phaseKey = (phase || 't5').toLowerCase().replace('-', '').replace('pre-bis', 'preraid');
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

// ==========================================
// SPECS
// ==========================================
app.get('/api/specs', (req, res) => {
  try {
    const { class: className } = req.query;
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

// ==========================================
// SLOTS
// ==========================================
app.get('/api/slots', (req, res) => {
  try {
    const rows = db.prepare('SELECT DISTINCT slot FROM items WHERE slot IS NOT NULL ORDER BY slot').all();
    res.json(rows.map(r => r.slot));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3001, () => console.log('Guild Loot API running on http://localhost:3001'));