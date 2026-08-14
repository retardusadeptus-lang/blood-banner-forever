const express = require('express');

async function fetchReportsFromWcl({ db } = {}) {
  const config = require('../config');
  const guildId = String(config.WARCRAFTLOGS_GUILD_ID || '').trim();
  const apiKey = String(config.WARCRAFTLOGS_API_KEY || '').trim();
  const apiBaseUrl = String(config.WARCRAFTLOGS_API_BASE_URL || 'https://classic.warcraftlogs.com/api/v2/client').trim();

  if (!guildId || !apiKey) {
    return [];
  }

  const response = await fetch(apiBaseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      query: `
        query GuildReports($guildId: ID!, $limit: Int!) {
          guild(id: $guildId) {
            reports(limit: $limit) {
              id
              title
              startTime
              endTime
              duration
              zone
              fights {
                id
                name
                kill
                difficulty
                bossPercentage
                duration
              }
            }
          }
        }
      `,
      variables: { guildId, limit: 10 }
    })
  });

  if (!response.ok) {
    throw new Error(`Warcraft Logs request failed: ${response.status}`);
  }

  const payload = await response.json();
  const rawReports = payload?.data?.guild?.reports || [];
  const normalizedReports = Array.isArray(rawReports) ? rawReports.map((report) => {
    const fights = Array.isArray(report.fights) ? report.fights.map((fight) => ({
      id: fight?.id || null,
      name: fight?.name || 'Unknown boss',
      kill: Boolean(fight?.kill),
      difficulty: fight?.difficulty ?? null,
      bossPercentage: fight?.bossPercentage ?? null,
      duration: fight?.duration ?? null
    })) : [];

    const bossKills = fights.filter((fight) => fight.kill).length;

    return {
      id: String(report.id || report.reportID || '').trim() || null,
      title: report.title || 'Unnamed report',
      zone: report.zone || report.area || 'Raid',
      startTime: report.startTime || report.start_time || null,
      endTime: report.endTime || report.end_time || null,
      durationMs: report.duration ?? report.durationMs ?? report.duration_ms ?? null,
      totalFights: fights.length,
      bossKills,
      fights,
      url: report.url || (report.id ? `https://classic.warcraftlogs.com/reports/${report.id}` : null)
    };
  }) : [];

  if (db && Array.isArray(normalizedReports) && normalizedReports.length > 0) {
    const upsert = db.prepare(`
      INSERT INTO warcraftlogs_reports (id, title, zone, start_time, end_time, duration_ms, total_fights, boss_kills, fights_json, url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        zone = excluded.zone,
        start_time = excluded.start_time,
        end_time = excluded.end_time,
        duration_ms = excluded.duration_ms,
        total_fights = excluded.total_fights,
        boss_kills = excluded.boss_kills,
        fights_json = excluded.fights_json,
        url = excluded.url,
        synced_at = CURRENT_TIMESTAMP
    `);

    db.transaction(() => {
      normalizedReports.forEach((report) => {
        if (!report?.id) return;
        upsert.run(
          String(report.id),
          report.title || 'Unnamed report',
          report.zone || 'Raid',
          report.startTime || null,
          report.endTime || null,
          report.durationMs ?? null,
          Number(report.totalFights || 0),
          Number(report.bossKills || 0),
          JSON.stringify(report.fights || []),
          report.url || null
        );
      });
    })();
  }

  return normalizedReports;
}

function buildWarcraftLogsRoutes({ db } = {}) {
  const router = express.Router();

  const readReportsFromDb = () => {
    if (!db) return [];

    const rows = db.prepare(`
      SELECT id, title, zone, start_time, end_time, duration_ms, total_fights, boss_kills, fights_json, url, synced_at
      FROM warcraftlogs_reports
      ORDER BY synced_at DESC, id DESC
      LIMIT 10
    `).all();

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      zone: row.zone,
      startTime: row.start_time,
      endTime: row.end_time,
      durationMs: row.duration_ms,
      totalFights: Number(row.total_fights || 0),
      bossKills: Number(row.boss_kills || 0),
      fights: JSON.parse(row.fights_json || '[]'),
      url: row.url,
      syncedAt: row.synced_at
    }));
  };

  router.get('/warcraftlogs/recent-reports', async (req, res) => {
    try {
      const forceRefresh = String(req.query.force || '').toLowerCase() === 'true';
      if (forceRefresh) {
        const reports = await fetchReportsFromWcl({ db });
        return res.json(reports);
      }

      const cachedReports = readReportsFromDb();
      if (cachedReports.length > 0) {
        return res.json(cachedReports);
      }

      const reports = await fetchReportsFromWcl({ db });
      return res.json(reports);
    } catch (error) {
      console.error('[WCL] recent reports fetch failed:', error);
      return res.json(readReportsFromDb());
    }
  });

  return router;
}

module.exports = buildWarcraftLogsRoutes;
module.exports.fetchReportsFromWcl = fetchReportsFromWcl;
