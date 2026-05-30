PRAGMA foreign_keys = ON;

-- Drop old blob tables we're replacing
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS player_stats;
DROP TABLE IF EXISTS raid_logs_blob;

-- Assignments: one row per player per item per phase
CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phase VARCHAR(20) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    player_id INTEGER NOT NULL,
    rank INTEGER,
    is_pass INTEGER DEFAULT 0,
    UNIQUE(phase, item_name, player_id)
);

-- Player base stats
CREATE TABLE IF NOT EXISTS player_stats (
    player_id INTEGER PRIMARY KEY,
    consumables INTEGER DEFAULT 0,
    enchants INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 0,
    afks INTEGER DEFAULT 0,
    manual_adjustment REAL DEFAULT 0,
    manual_adjustment_note VARCHAR(255)
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
    UNIQUE(player_id, boss_name)
);

-- Raid logs
CREATE TABLE IF NOT EXISTS raid_logs (
    id INTEGER PRIMARY KEY,
    raid_date VARCHAR(20) NOT NULL,
    zone VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Raid attendees join table: one row per player per raid
CREATE TABLE IF NOT EXISTS raid_attendees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raid_id INTEGER NOT NULL REFERENCES raid_logs(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL,
    UNIQUE(raid_id, player_id)
);