import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('About Us renders editable content controls for authorized users', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: RecruitmentAboutTab } = await server.ssrLoadModule('/src/components/RecruitmentAboutTab.jsx');
    const html = renderToStaticMarkup(createElement(RecruitmentAboutTab, {
      canEdit: true,
      fetchData: async () => ({}),
      putData: async () => ({}),
      siteTabMetadata: { id: 'recruitment.about', groupKey: 'recruitment' }
    }));

    assert.match(html, /data-site-tab-id="recruitment\.about"/);
    assert.match(html, />Edit Content<\/button>/);
    assert.match(html, />Our guild<\/h3>/);
    assert.match(html, />Join the guild<\/h3>/);
    assert.match(html, />Apply to join<\/a>/);
  } finally {
    await server.close();
  }
});
