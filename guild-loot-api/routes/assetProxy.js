const express = require('express');

const ALLOWED_HOSTS = new Set(['wow.zamimg.com', 'www.wowhead.com', 'tbc.wowhead.com', 'nether.wowhead.com']);
const MAX_ASSET_BYTES = 2 * 1024 * 1024;

function buildAssetProxyRoutes() {
  const router = express.Router();

  router.get(/^\/proxy\/wowhead\/(nether|www|tbc)\/(.*)$/, async (req, res) => {
    const host = `${req.params[0]}.wowhead.com`;
    const target = new URL(`https://${host}/${req.params[1]}`);
    target.search = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';

    try {
      const upstream = await fetch(target, { redirect: 'error' });
      if (!upstream.ok || !upstream.body) return res.status(upstream.status || 502).end();
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      const payload = Buffer.from(await upstream.arrayBuffer());
      if (payload.length > MAX_ASSET_BYTES) return res.status(413).end();
      return res.send(payload);
    } catch (error) {
      console.error('[asset-proxy] wowhead request failed', error);
      return res.status(502).json({ error: 'Unable to fetch Wowhead data.' });
    }
  });

  router.get('/proxy/asset', async (req, res) => {
    const rawUrl = String(req.query.url || '').trim();
    let target;
    try {
      target = new URL(rawUrl);
    } catch {
      return res.status(400).json({ error: 'A valid asset URL is required.' });
    }

    if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname)) {
      return res.status(403).json({ error: 'Asset host is not allowed.' });
    }

    try {
      const upstream = await fetch(target, { redirect: 'error' });
      if (!upstream.ok || !upstream.body) {
        return res.status(upstream.status || 502).end();
      }

      const contentType = upstream.headers.get('content-type') || '';
      const contentLength = Number(upstream.headers.get('content-length') || 0);
      const isAllowedContent = contentType.startsWith('image/') || contentType.includes('javascript');
      if (!isAllowedContent || contentLength > MAX_ASSET_BYTES) {
        return res.status(415).end();
      }

      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Type', contentType);
      if (contentType.includes('javascript') && target.pathname === '/widgets/power.js') {
        const script = await upstream.text();
        const rewrittenScript = script.replace(
          'return"https://"+e+".wowhead.com"',
          'return"/api/proxy/wowhead/"+e'
        );
        return res.send(rewrittenScript);
      }
      if (contentLength) res.setHeader('Content-Length', contentLength);

      const reader = upstream.body.getReader();
      let totalBytes = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalBytes += value.byteLength;
          if (totalBytes > MAX_ASSET_BYTES) {
            reader.cancel().catch(() => {});
            return res.destroy();
          }
          res.write(value);
        }
        return res.end();
      } catch (error) {
        return res.destroy(error);
      }
    } catch (error) {
      console.error('[asset-proxy] upstream request failed', error);
      return res.status(502).json({ error: 'Unable to fetch asset.' });
    }
  });

  return router;
}

module.exports = buildAssetProxyRoutes;