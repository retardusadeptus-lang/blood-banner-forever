import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { getSiteNavigationGroups, getVisibleSiteTabs } from '../config/siteRegistry.js';

test('main navigation renders groups in the persisted order', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: DashboardNavigationTabs } = await server.ssrLoadModule('/src/components/DashboardNavigationTabs.jsx');
    let orderByGroup = {};
    for (let index = 0; index < 3; index += 1) {
      const groups = getSiteNavigationGroups({ orderByGroup });
      const recruitmentIndex = groups.findIndex(group => group.key === 'recruitment');
      const previousGroup = groups[recruitmentIndex - 1];
      orderByGroup = Object.fromEntries(groups.map((group, position) => [group.key, position]));
      [orderByGroup.recruitment, orderByGroup[previousGroup.key]] = [orderByGroup[previousGroup.key], orderByGroup.recruitment];
    }

    const subTabs = Object.fromEntries(
      getSiteNavigationGroups({ orderByGroup }).map(group => [
        group.key,
        getVisibleSiteTabs(group.key, {
          audience: 'Admin',
          isAuthenticated: true,
          canViewScoring: true,
          canViewSitemap: true
        })
      ])
    );
    const html = renderToStaticMarkup(createElement(DashboardNavigationTabs, {
      activeSiteTabId: 'recruitment.focus',
      hoveredNavTab: 'admin',
      setHoveredNavTab: () => {},
      handleMainNavSelect: () => {},
      getDropdownItemActiveState: () => false,
      subTabs,
      orderByGroup
    }));

    assert.ok(html.indexOf('Recruitment') < html.indexOf('Guild Bank'));
    assert.match(html, /href="\/\?page=admin\.config"/);
  } finally {
    await server.close();
  }
});
