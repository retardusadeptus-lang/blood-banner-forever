function createWarcraftLogsSync({ fetchReportsFromWcl } = {}) {
  let syncInFlight = false;

  async function runOnce() {
    if (syncInFlight) return [];
    syncInFlight = true;

    try {
      if (typeof fetchReportsFromWcl !== 'function') {
        return [];
      }
      return await fetchReportsFromWcl();
    } finally {
      syncInFlight = false;
    }
  }

  function scheduleAtUkNightly({ hour = 23, minute = 0 } = {}) {
    const tick = () => {
      const now = new Date();
      const londonNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
      const target = new Date(londonNow);
      target.setHours(hour, minute, 0, 0);

      const waitMs = target.getTime() - londonNow.getTime();
      const timeoutMs = waitMs > 0 ? waitMs : (24 * 60 * 60 * 1000) + waitMs;

      setTimeout(() => {
        runOnce().catch(() => {});
        setTimeout(tick, 60 * 60 * 1000);
      }, timeoutMs);
    };

    tick();
    return { runOnce };
  }

  return { runOnce, scheduleAtUkNightly };
}

module.exports = {
  createWarcraftLogsSync
};
