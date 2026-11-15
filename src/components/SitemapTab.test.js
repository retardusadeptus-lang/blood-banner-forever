import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { SITE_TABS } from '../config/siteRegistry.js';

test('sitemap renders every registered tab in its configured order', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: SitemapTab } = await server.ssrLoadModule('/src/components/SitemapTab.jsx');
    const html = renderToStaticMarkup(createElement(SitemapTab, {
      orderByTab: { 'profiles.meet-guild': 0, 'profiles.my-characters': 1 }
    }));
    const labels = [...html.matchAll(/<span class="font-semibold text-slate-200">([^<]+)<\/span>/g)]
      .map(match => match[1]);
    assert.deepEqual([...labels].sort(), SITE_TABS.map(tab => tab.label).sort());
    assert.ok(labels.indexOf('Meet the Guild') < labels.indexOf('My Characters'));
  } finally {
    await server.close();
  }
});
