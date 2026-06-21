PRAGMA foreign_keys = ON;

-- Legacy bootstrap for operational tables. If you already have mydb.db,
-- you can ship that file directly instead of recreating the database here.

DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS player_stats;
DROP TABLE IF EXISTS player_parses;
DROP TABLE IF EXISTS raid_logs;
DROP TABLE IF EXISTS raid_attendees;
DROP TABLE IF EXISTS roster;
DROP TABLE IF EXISTS bis_priorities;
DROP TABLE IF EXISTS scoring_config;
DROP TABLE IF EXISTS bank_items;
DROP TABLE IF EXISTS bank_uploads;
DROP TABLE IF EXISTS bank_requests;
DROP TABLE IF EXISTS raid_assignment_data;
DROP TABLE IF EXISTS raid_assignment_config;
DROP TABLE IF EXISTS raid_assignment_images;

CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phase VARCHAR(20) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    player_id INTEGER NOT NULL,
    rank INTEGER,
    is_pass INTEGER DEFAULT 0,
    UNIQUE(phase, item_name, player_id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_stats (
    player_id INTEGER PRIMARY KEY,
    consumables INTEGER DEFAULT 0,
    enchants INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 0,
    afks INTEGER DEFAULT 0,
    manual_adjustment REAL DEFAULT 0,
    manual_adjustment_note VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_parses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    boss_name VARCHAR(255) NOT NULL,
    parse_value REAL,
    is_support INTEGER DEFAULT 0,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'manual',
    UNIQUE(player_id, boss_name),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raid_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raid_date VARCHAR(20) NOT NULL,
    zone VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raid_attendees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raid_id INTEGER NOT NULL REFERENCES raid_logs(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL,
    UNIQUE(raid_id, player_id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roster (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    spec_id INTEGER NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
    in_raid INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bis_priorities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phase VARCHAR(20) NOT NULL UNIQUE,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scoring_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_wowhead_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    sub_type VARCHAR(100) DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_count INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    item_wowhead_id INTEGER NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    reason TEXT DEFAULT '',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    price INTEGER,
    officer_note TEXT DEFAULT '',
    approved_quantity INTEGER,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raid_assignment_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raid_assignment_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enabled_bosses TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raid_assignment_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    boss_name VARCHAR(255) NOT NULL,
    caption TEXT DEFAULT '',
    image_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bis_priority_entries (
    phase TEXT NOT NULL,
    item_name TEXT NOT NULL,
    spec_name TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (phase, item_name, spec_name)
);

CREATE TABLE IF NOT EXISTS scoring_config_values (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    parse_weight REAL NOT NULL DEFAULT 1,
    support_multi REAL NOT NULL DEFAULT 1.5,
    cons_bonus REAL NOT NULL DEFAULT 10,
    enchant_bonus REAL NOT NULL DEFAULT 10,
    gem_bonus REAL NOT NULL DEFAULT 10,
    att_weight REAL NOT NULL DEFAULT 0.5,
    afk_penalty REAL NOT NULL DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raid_assignment_config_bosses (
    boss_name TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assignments_phase_item ON assignments (phase, item_name);
CREATE INDEX IF NOT EXISTS idx_assignments_phase_player ON assignments (phase, player_id);
CREATE INDEX IF NOT EXISTS idx_player_parses_player_boss ON player_parses (player_id, boss_name);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_stats (player_id);
CREATE INDEX IF NOT EXISTS idx_raid_logs_date ON raid_logs (raid_date);
CREATE INDEX IF NOT EXISTS idx_roster_spec_id ON roster (spec_id);
CREATE INDEX IF NOT EXISTS idx_bank_items_category_name ON bank_items (category, name);
CREATE INDEX IF NOT EXISTS idx_bank_requests_status_created ON bank_requests (status, created_at);
CREATE INDEX IF NOT EXISTS idx_raid_assignment_images_boss_created ON raid_assignment_images (boss_name, created_at);
CREATE INDEX IF NOT EXISTS idx_bis_priority_entries_phase_item ON bis_priority_entries (phase, item_name);
CREATE INDEX IF NOT EXISTS idx_bis_priority_entries_phase_spec ON bis_priority_entries (phase, spec_name);