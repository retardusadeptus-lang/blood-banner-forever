const express = require('express');
const { hasAdminAccess } = require('../../middleware/auth');

const SITE_ROLES = new Set(['Public', 'Guild Member', 'Officer', 'Admin']);
const SITE_GROUPS = new Set(['bank', 'raidAssignments', 'raidSignups', 'recruitment', 'resources', 'loot', 'admin']);

function normalizeOverrides(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([tabId, roles]) => {
    const normalizedRoles = Array.isArray(roles)
      ? [...new Set(roles.filter(role => SITE_ROLES.has(role)))]
      : [];
    return [String(tabId), normalizedRoles];
  }));
}

function normalizeMap(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeGroupMap(value) {
  return Object.fromEntries(Object.entries(normalizeMap(value))
    .filter(([, groupKey]) => typeof groupKey === 'string' && SITE_GROUPS.has(groupKey))
    .map(([tabId, groupKey]) => [String(tabId), groupKey]));
}

function normalizeOrderMap(value) {
  return Object.fromEntries(Object.entries(normalizeMap(value))
    .map(([tabId, order]) => [String(tabId), Number(order)])
    .filter(([, order]) => Number.isFinite(order)));
}

function buildAdminSiteVisibilityRoutes({ db, sessionSecret }) {
  const router = express.Router();
  const requireAdmin = (req, res, next) => {
    if (!hasAdminAccess(req, { sessionSecret, db })) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }
    return next();
  };

  router.get('/site-visibility', (req, res) => {
    try {
      const row = db.prepare('SELECT surface_roles_by_tab_json, group_by_tab_json, order_by_tab_json, section_visibility_by_id_json FROM site_visibility_config WHERE id = 1').get();
      const parsed = JSON.parse(row?.surface_roles_by_tab_json || '{}');
      res.json({
        surface_roles_by_tab: normalizeOverrides(parsed),
        group_by_tab: normalizeGroupMap(JSON.parse(row?.group_by_tab_json || '{}')),
        order_by_tab: normalizeOrderMap(JSON.parse(row?.order_by_tab_json || '{}')),
        section_visibility_by_id: normalizeMap(JSON.parse(row?.section_visibility_by_id_json || '{}'))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/site-visibility', requireAdmin, (req, res) => {
    try {
      const overrides = normalizeOverrides(req.body?.surface_roles_by_tab);
      const groupByTab = normalizeGroupMap(req.body?.group_by_tab);
      const orderByTab = normalizeOrderMap(req.body?.order_by_tab);
      const sectionVisibilityById = Object.fromEntries(Object.entries(normalizeMap(req.body?.section_visibility_by_id)).map(([sectionId, visible]) => [String(sectionId), Boolean(visible)]));
      db.prepare(`
        UPDATE site_visibility_config
        SET surface_roles_by_tab_json = ?, group_by_tab_json = ?, order_by_tab_json = ?, section_visibility_by_id_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(JSON.stringify(overrides), JSON.stringify(groupByTab), JSON.stringify(orderByTab), JSON.stringify(sectionVisibilityById));
      res.json({ ok: true, surface_roles_by_tab: overrides, group_by_tab: groupByTab, order_by_tab: orderByTab, section_visibility_by_id: sectionVisibilityById });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = buildAdminSiteVisibilityRoutes;
