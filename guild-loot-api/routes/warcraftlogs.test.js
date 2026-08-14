const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const buildWarcraftLogsRoutes = require('./warcraftlogs');

function createApp() {
  const app = express();
  app.use('/api', buildWarcraftLogsRoutes({}));
  return app;
}

test('GET /api/warcraftlogs/recent-reports returns an empty array when WCL is not configured', async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/warcraftlogs/recent-reports`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.deepEqual(payload, []);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
