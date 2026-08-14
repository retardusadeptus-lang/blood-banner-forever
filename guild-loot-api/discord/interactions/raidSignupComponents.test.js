'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildMainSignupComponents } = require('./raidSignupComponents');
const { buildSignupEmbed } = require('./raidSignupEmbed');

test('buildSignupEmbed keeps tank and healer on the first row and pushes ranged/melee to the next row', () => {
  const event = { title: 'Raid Signup', description: 'Test event', scheduled_for: '2026-08-15T19:00:00Z' };
  const entries = [
    { discord_username: 'TankUser', status: 'signup', role_bucket: 'tank', spec_class: 'Warrior', spec_name: 'Protection' },
    { discord_username: 'HealerUser', status: 'signup', role_bucket: 'healer', spec_class: 'Paladin', spec_name: 'Holy' },
    { discord_username: 'RangedUser', status: 'signup', role_bucket: 'ranged', spec_class: 'Mage', spec_name: 'Arcane' },
    { discord_username: 'MeleeUser', status: 'signup', role_bucket: 'melee', spec_class: 'Rogue', spec_name: 'Subtlety' }
  ];

  const embed = buildSignupEmbed(event, entries, null);
  const fields = embed.data.fields;

  assert.ok(fields[3].name.includes('Tank'));
  assert.equal(fields[4].name, '\u200b');
  assert.ok(fields[5].name.includes('Healer'));
  assert.ok(fields[6].name.includes('DPS (Ranged)'));
  assert.equal(fields[7].name, '\u200b');
  assert.ok(fields[8].name.includes('DPS (Melee)'));
});

test('buildMainSignupComponents restores the current user\'s saved spec and character name', () => {
  const specs = [
    { id: 1, class: 'Druid', spec: 'Balance' },
    { id: 2, class: 'Druid', spec: 'Feral' }
  ];

  const rows = buildMainSignupComponents('event-1', ['Druid'], specs, '', false, 'Steve', 2);
  const [characterRow, specRow] = rows;

  assert.equal(characterRow.components[0].data.label, 'Character Name: Steve');

  const selectJson = specRow.components[0].toJSON();
  assert.equal(selectJson.options[0].default, false);
  assert.equal(selectJson.options[1].default, true);
  assert.equal(selectJson.options[1].label, 'Druid - Feral');
});

test('buildMainSignupComponents ignores the stale TestHero placeholder value', () => {
  const specs = [
    { id: 1, class: 'Druid', spec: 'Balance' },
    { id: 2, class: 'Druid', spec: 'Feral' }
  ];

  const rows = buildMainSignupComponents('event-1', ['Druid'], specs, '', false, 'TestHero', 2);
  const [characterRow] = rows;

  assert.equal(characterRow.components[0].data.label, 'Enter Character Name');
});
