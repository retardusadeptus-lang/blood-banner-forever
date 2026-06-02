PRAGMA foreign_keys = ON;

-- Drop old blob tables we're replacing
DROP TABLE assignments;
DROP TABLE player_stats;
DROP TABLE player_parses;
DROP TABLE raid_logs;
DROP TABLE raid_attendees;
DROP TABLE roster;
DROP TABLE bis_priorities;
DROP TABLE scoring_config;
DROP TABLE mutable_items;


-- Assignments: one row per player per item per phase
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

-- Player base stats
CREATE TABLE IF NOT EXISTS player_stats (
    player_id INTEGER PRIMARY KEY AUTOINCREMENT,
    consumables INTEGER DEFAULT 0,
    enchants INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 0,
    afks INTEGER DEFAULT 0,
    manual_adjustment REAL DEFAULT 0,
    manual_adjustment_note VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Parses: one row per player per boss, ready for Warcraftlogs
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

-- Raid logs
CREATE TABLE IF NOT EXISTS raid_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raid_date VARCHAR(20) NOT NULL,
    zone VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Raid attendees join table: one row per player per raid
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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mutable_items (
    data TEXT NOT NULL,
);