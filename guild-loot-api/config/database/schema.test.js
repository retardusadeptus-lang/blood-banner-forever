const assert = require('node:assert/strict');
const test = require('node:test');
const Database = require('better-sqlite3');
const { ensureDatabaseReady } = require('./schema');

test('initializes a fresh database before applying dependent migrations', () => {
  const db = new Database(':memory:');

  assert.doesNotThrow(() => ensureDatabaseReady(db));

  for (const tableName of ['specs', 'items', 'items_bis', 'roster', 'users', 'character_profiles', 'recruitment_about_config', 'raid_signup_chase_notifications']) {
    const table = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(tableName);
    assert.ok(table, `expected ${tableName} to be created`);
  }
  const profileVisibility = db
    .prepare("SELECT name FROM pragma_table_info('character_profiles') WHERE name = 'visibility'")
    .get();
  assert.ok(profileVisibility);
  const defaultThemeConfig = db
    .prepare('SELECT default_theme_palette, default_theme_font FROM scoring_config_values WHERE id = 1')
    .get();
  assert.deepEqual(defaultThemeConfig, { default_theme_palette: 'azure', default_theme_font: 'system' });

  db.close();
});

test('adds main navigation ordering to an existing site visibility configuration', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE site_visibility_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      surface_roles_by_tab_json TEXT NOT NULL DEFAULT '{}',
      group_by_tab_json TEXT NOT NULL DEFAULT '{}',
      order_by_tab_json TEXT NOT NULL DEFAULT '{}',
      section_visibility_by_id_json TEXT NOT NULL DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO site_visibility_config (id) VALUES (1);
  `);

  assert.doesNotThrow(() => ensureDatabaseReady(db));

  const column = db
    .prepare("SELECT name FROM pragma_table_info('site_visibility_config') WHERE name = 'order_by_group_json'")
    .get();
  assert.ok(column);
  assert.equal(db.prepare('SELECT order_by_group_json FROM site_visibility_config WHERE id = 1').get().order_by_group_json, '{}');
  db.close();
});

test('adds default appearance settings to an existing scoring configuration', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE scoring_config_values (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      parse_weight REAL NOT NULL DEFAULT 1,
      support_multi REAL NOT NULL DEFAULT 1.5,
      cons_bonus REAL NOT NULL DEFAULT 10,
      enchant_bonus REAL NOT NULL DEFAULT 10,
      gem_bonus REAL NOT NULL DEFAULT 10,
      att_weight REAL NOT NULL DEFAULT 0.5,
      afk_penalty REAL NOT NULL DEFAULT 5,
      guild_role_ranks TEXT NOT NULL DEFAULT '[]',
      default_site_phase TEXT NOT NULL DEFAULT 'T6',
      default_site_tab TEXT NOT NULL DEFAULT 'recruitment.focus',
      claim_game_version TEXT NOT NULL DEFAULT 'all',
      claim_fallback_enabled INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO scoring_config_values (id) VALUES (1);
  `);

  assert.doesNotThrow(() => ensureDatabaseReady(db));

  const appearanceConfig = db
    .prepare('SELECT default_theme_palette, default_theme_font FROM scoring_config_values WHERE id = 1')
    .get();
  assert.deepEqual(appearanceConfig, { default_theme_palette: 'azure', default_theme_font: 'system' });
  db.close();
});
