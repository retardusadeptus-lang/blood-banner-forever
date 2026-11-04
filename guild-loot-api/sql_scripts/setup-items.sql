PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS specs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class VARCHAR(100) NOT NULL,
    spec VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    slot VARCHAR(100),
    phase VARCHAR(100),
    source VARCHAR(255),
    source_type VARCHAR(100),
    drop_chance REAL,
    rarity VARCHAR(100),
    wowhead_id INTEGER
);

CREATE TABLE IF NOT EXISTS items_bis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES items(id),
    spec_id INTEGER NOT NULL REFERENCES specs(id),
    preraid_bis INTEGER DEFAULT 0,
    t4_bis INTEGER DEFAULT 0,
    t5_bis INTEGER DEFAULT 0,
    t6_bis INTEGER DEFAULT 0,
    za_bis INTEGER DEFAULT 0,
    swp_bis INTEGER DEFAULT 0,
    preraid_opt INTEGER DEFAULT 0,
    t4_opt INTEGER DEFAULT 0,
    t5_opt INTEGER DEFAULT 0,
    t6_opt INTEGER DEFAULT 0,
    za_opt INTEGER DEFAULT 0,
    swp_opt INTEGER DEFAULT 0,
    ongoing_bis INTEGER DEFAULT 0,
    ongoing_opt INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_items_name ON items (name);
CREATE INDEX IF NOT EXISTS idx_items_slot_phase ON items (slot, phase);
CREATE INDEX IF NOT EXISTS idx_items_source ON items (source, source_type);
CREATE INDEX IF NOT EXISTS idx_items_bis_item_spec ON items_bis (item_id, spec_id);