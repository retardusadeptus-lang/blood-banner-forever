const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDiscordService } = require('./discord');

function createService(overrides = {}) {
  const calls = [];
  const service = buildDiscordService({
    siteUrl: 'https://forever.example/',
    bankChannelId: '111111111111111111',
    recruitmentChannelId: '222222222222222222',
    sendChannelMessage: async (channelId, payload, label) => {
      calls.push({ channelId, payload, label });
      return { sent: true };
    },
    ...overrides
  });

  return { service, calls };
}

test('bank notifications use the configured bot channel and allowed user mentions', async () => {
  const { service, calls } = createService();

  const result = await service.sendBankResolutionNotification({
    player_name: 'Applicant',
    item_name: 'Healing Potion',
    quantity: 2,
    approved_quantity: 1,
    status: 'approved',
    requester_discord_user_id: '333333333333333333'
  });

  assert.deepEqual(result, { sent: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].channelId, '111111111111111111');
  assert.equal(calls[0].payload.username, undefined);
  assert.deepEqual(calls[0].payload.allowedMentions, {
    parse: [],
    users: ['333333333333333333']
  });
  assert.match(calls[0].payload.content, /<@333333333333333333>/);
});

test('recruitment lifecycle notifications use the recruitment bot channel', async () => {
  const { service, calls } = createService();

  const result = await service.sendRecruitmentApplicationNotification({
    event: 'status_changed',
    previousStatus: 'pending',
    application: {
      name: 'Applicant',
      battletag: 'Applicant#1234',
      class_name: 'Mage',
      spec: 'Fire',
      status: 'approved',
      about_me: 'Ready to raid.',
      officer_note: 'Good fit.'
    }
  });

  assert.deepEqual(result, { sent: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].channelId, '222222222222222222');
  assert.match(calls[0].payload.embeds[0].title, /status changed/i);
  assert.deepEqual(calls[0].payload.allowedMentions, { parse: [] });
  assert.equal(calls[0].payload.embeds[0].fields.some(field => field.name === 'Previous status' && field.value === 'pending'), true);
});

test('notifications report missing channel configuration without attempting a send', async () => {
  let sendAttempts = 0;
  const { service } = createService({
    bankChannelId: '',
    sendChannelMessage: async () => {
      sendAttempts += 1;
      return { sent: true };
    }
  });

  const result = await service.sendBankInventoryNotification([]);

  assert.deepEqual(result, { sent: false, reason: 'missing-channel-id' });
  assert.equal(sendAttempts, 0);
});
