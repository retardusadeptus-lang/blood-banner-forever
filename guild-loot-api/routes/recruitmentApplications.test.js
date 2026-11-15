const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createBattleNetSession } = require('../middleware/auth');
const buildRecruitmentApplicationsRoutes = require('./recruitmentApplications');

function createDb() {
  const configRows = [{ id: 1, blurb: 'Welcome to recruitment.' }];
  const appRows = [];
  const users = [{ id: 42, battletag: 'Applicant#1234' }, { id: 99, battletag: 'Officer#0001' }];
  const roles = [{ user_id: 99, role: 'officer' }];
  let nextId = 1;

  return {
    prepare(query) {
      const normalized = query.trim();

      if (normalized.startsWith('SELECT') && normalized.includes('FROM recruitment_applications_config')) {
        return {
          get() { return configRows[0] || null; },
          all() { return configRows; }
        };
      }

      if (normalized.startsWith('INSERT') && normalized.includes('recruitment_applications_config')) {
        return {
          run(blurb) {
            configRows.length = 0;
            configRows.push({ id: 1, blurb: String(blurb || '') });
            return { changes: 1 };
          }
        };
      }

      if (normalized.startsWith('SELECT') && normalized.includes('FROM users WHERE id = ?')) {
        return {
          get(userId) {
            return users.find(user => Number(user.id) === Number(userId)) || null;
          }
        };
      }

      if (normalized.startsWith('SELECT') && normalized.includes('FROM bnet_user_roles WHERE user_id = ?')) {
        return {
          get(userId) {
            return roles.find(role => Number(role.user_id) === Number(userId)) || null;
          }
        };
      }

      if (normalized.startsWith('SELECT') && normalized.includes('FROM recruitment_applications')) {
        return {
          all() { return [...appRows]; },
          get(arg) {
            if (typeof arg === 'number' || typeof arg === 'string') {
              return appRows.find(row => Number(row.id) === Number(arg)) || null;
            }
            return appRows[0] || null;
          }
        };
      }

      if (normalized.startsWith('INSERT') && normalized.includes('recruitment_applications')) {
        return {
          run(...args) {
            const row = {
              id: nextId++,
              user_id: args[0],
              battletag: args[1],
              discord_id: args[2],
              class_name: args[3],
              spec: args[4],
              name: args[5],
              about_me: args[6],
              status: 'pending',
              officer_note: '',
              reviewed_by_user_id: null,
              reviewed_by_battletag: null,
              reviewed_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            appRows.push(row);
            return { lastInsertRowid: row.id };
          }
        };
      }

      if (normalized.startsWith('UPDATE recruitment_applications')) {
        return {
          run(...args) {
            const [status, officerNote, reviewedByUserId, reviewedByBattletag, reviewedAt, statusChangedAt, statusHistoryJson, id] = args;
            const row = appRows.find(item => Number(item.id) === Number(id));
            if (!row) return { changes: 0 };
            row.status = status;
            row.officer_note = officerNote ?? row.officer_note ?? '';
            row.reviewed_by_user_id = reviewedByUserId ?? row.reviewed_by_user_id ?? null;
            row.reviewed_by_battletag = reviewedByBattletag ?? row.reviewed_by_battletag ?? null;
            row.reviewed_at = reviewedAt ?? row.reviewed_at ?? new Date().toISOString();
            row.status_changed_at = statusChangedAt ?? row.status_changed_at ?? row.reviewed_at;
            row.status_history_json = statusHistoryJson ?? row.status_history_json ?? '[]';
            row.updated_at = new Date().toISOString();
            return { changes: 1 };
          }
        };
      }

      if (normalized.startsWith('DELETE FROM recruitment_applications')) {
        return {
          run(id) {
            const index = appRows.findIndex(item => Number(item.id) === Number(id));
            if (index === -1) return { changes: 0 };
            appRows.splice(index, 1);
            return { changes: 1 };
          }
        };
      }

      return {
        get() { return null; },
        all() { return []; },
        run() { return { changes: 0 }; }
      };
    }
  };
}

function createDiscordService() {
  return {
    sendRecruitmentApplicationNotification: async () => ({ sent: true })
  };
}

test('POST /api/recruitment-applications stores the applicant and returns the created record', async () => {
  const db = createDb();
  const app = express();
  app.use(express.json());
  app.use('/api', buildRecruitmentApplicationsRoutes({
    db,
    sessionSecret: 'test-secret',
    discordService: createDiscordService()
  }));

  const server = app.listen(0);
  try {
    const port = server.address().port;
    const { token } = createBattleNetSession({ userId: 42, battletag: 'Applicant#1234' });

    const response = await fetch(`http://127.0.0.1:${port}/api/recruitment-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${token}`
      },
      body: JSON.stringify({
        className: 'Mage',
        spec: 'Fire',
        name: 'Applicant',
        discordId: 'applicant.1234',
        aboutMe: 'I have prior raid experience\n\nand I want a chill environment.'
      })
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.className, 'Mage');
    assert.equal(payload.name, 'Applicant');
    assert.equal(payload.applicantBattletag, 'Applicant#1234');
    assert.equal(payload.discordId, 'applicant.1234');
    assert.equal(payload.status, 'pending');
    assert.equal(payload.aboutMe, 'I have prior raid experience\n\nand I want a chill environment.');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('POST /api/recruitment-applications/:id/contact lets officers send bespoke Discord messages', async () => {
  const db = createDb();
  const sentMessages = [];
  const app = express();
  app.use(express.json());
  app.use('/api', buildRecruitmentApplicationsRoutes({
    db,
    sessionSecret: 'test-secret',
    discordService: createDiscordService(),
    sendDirectMessage: async (discordId, message) => {
      sentMessages.push({ discordId, message });
      return true;
    }
  }));

  const server = app.listen(0);
  try {
    const port = server.address().port;
    const { token: applicantToken } = createBattleNetSession({ userId: 42, battletag: 'Applicant#1234' });
    const { token: officerToken } = createBattleNetSession({ userId: 99, battletag: 'Officer#0001' });

    const submission = await fetch(`http://127.0.0.1:${port}/api/recruitment-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${applicantToken}`
      },
      body: JSON.stringify({
        className: 'Priest',
        spec: 'Holy',
        name: 'ApplicantThree',
        discordId: '123456789012345678',
        aboutMe: 'I enjoy healing and helping the group.'
      })
    });

    assert.equal(submission.status, 201);
    const created = await submission.json();

    const forbidden = await fetch(`http://127.0.0.1:${port}/api/recruitment-applications/${created.id}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${applicantToken}`
      },
      body: JSON.stringify({ message: 'Please join the guild Discord.' })
    });

    assert.equal(forbidden.status, 403);

    const contact = await fetch(`http://127.0.0.1:${port}/api/recruitment-applications/${created.id}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${officerToken}`
      },
      body: JSON.stringify({ message: 'Please join the guild Discord and message OfficerName when you arrive.' })
    });

    assert.equal(contact.status, 200);
    const payload = await contact.json();
    assert.equal(payload.sent, true);
    assert.equal(payload.applicationId, created.id);
    assert.deepEqual(sentMessages, [
      {
        discordId: '123456789012345678',
        message: 'Your recruitment application has been received by the guild. We will review it and update you when its status changes.'
      },
      {
        discordId: '123456789012345678',
        message: 'Message from guild officer Officer#0001:\n\nPlease join the guild Discord and message OfficerName when you arrive.'
      }
    ]);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('POST /api/recruitment-applications/:id/contact reports invalid recipients, bot failures, and missing applications', async () => {
  const db = createDb();
  const app = express();
  app.use(express.json());
  app.use('/api', buildRecruitmentApplicationsRoutes({
    db,
    sessionSecret: 'test-secret',
    discordService: createDiscordService(),
    sendDirectMessage: async () => false
  }));

  const server = app.listen(0);
  try {
    const port = server.address().port;
    const { token: applicantToken } = createBattleNetSession({ userId: 42, battletag: 'Applicant#1234' });
    const { token: officerToken } = createBattleNetSession({ userId: 99, battletag: 'Officer#0001' });

    const invalidSubmission = await fetch(`http://127.0.0.1:${port}/api/recruitment-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${applicantToken}`
      },
      body: JSON.stringify({
        className: 'Warrior',
        spec: 'Protection',
        name: 'ApplicantFour',
        discordId: 'applicant.1234',
        aboutMe: 'I am looking for a reliable team.'
      })
    });

    assert.equal(invalidSubmission.status, 201);
    const invalidApplication = await invalidSubmission.json();

    const invalidRecipient = await fetch(`http://127.0.0.1:${port}/api/recruitment-applications/${invalidApplication.id}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${officerToken}`
      },
      body: JSON.stringify({ message: 'Please join the guild Discord.' })
    });

    assert.equal(invalidRecipient.status, 400);
    const invalidPayload = await invalidRecipient.json();
    assert.equal(invalidPayload.reason, 'invalid-discord-id');

    const validSubmission = await fetch(`http://127.0.0.1:${port}/api/recruitment-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${officerToken}`
      },
      body: JSON.stringify({
        className: 'Druid',
        spec: 'Restoration',
        name: 'ProxyApplicant',
        discordId: '123456789012345679',
        aboutMe: 'A proxy application for testing delivery failures.',
        isProxy: true,
        proxyName: 'ProxyApplicant',
        proxyBattletag: 'ProxyApplicant#1234'
      })
    });

    assert.equal(validSubmission.status, 201);
    const validApplication = await validSubmission.json();

    const botFailure = await fetch(`http://127.0.0.1:${port}/api/recruitment-applications/${validApplication.id}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${officerToken}`
      },
      body: JSON.stringify({ message: 'Please join the guild Discord.' })
    });

    assert.equal(botFailure.status, 503);
    const botFailurePayload = await botFailure.json();
    assert.equal(botFailurePayload.reason, 'bot-unavailable');

    const missingApplication = await fetch(`http://127.0.0.1:${port}/api/recruitment-applications/999/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${officerToken}`
      },
      body: JSON.stringify({ message: 'Please join the guild Discord.' })
    });

    assert.equal(missingApplication.status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('PUT /api/recruitment-applications/:id/status lets officers approve or reject applications and DELETE removes them', async () => {
  const db = createDb();
  const app = express();
  app.use(express.json());
  app.use('/api', buildRecruitmentApplicationsRoutes({
    db,
    sessionSecret: 'test-secret',
    discordService: createDiscordService()
  }));

  const server = app.listen(0);
  try {
    const port = server.address().port;
    const { token: applicantToken } = createBattleNetSession({ userId: 42, battletag: 'Applicant#1234' });
    const { token: officerToken } = createBattleNetSession({ userId: 99, battletag: 'Officer#0001' });

    const submission = await fetch(`http://127.0.0.1:${port}/api/recruitment-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${applicantToken}`
      },
      body: JSON.stringify({
        className: 'Rogue',
        spec: 'Assassination',
        name: 'ApplicantTwo',
        aboutMe: 'I bring solid logs and reliable attendance.'
      })
    });

    assert.equal(submission.status, 201);
    const created = await submission.json();

    const approved = await fetch(`http://127.0.0.1:${port}/api/recruitment-applications/${created.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${officerToken}`
      },
      body: JSON.stringify({ status: 'approved', officerNote: 'Excellent fit for the raid team.' })
    });

    assert.equal(approved.status, 200);
    const approvedPayload = await approved.json();
    assert.equal(approvedPayload.status, 'approved');
    assert.equal(approvedPayload.officerNote, 'Excellent fit for the raid team.');

    const deleted = await fetch(`http://127.0.0.1:${port}/api/recruitment-applications/${created.id}`, {
      method: 'DELETE',
      headers: {
        Cookie: `wow_loot_bnet_sid=${officerToken}`
      }
    });

    assert.equal(deleted.status, 200);
    const deletedPayload = await deleted.json();
    assert.equal(deletedPayload.deleted, true);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
