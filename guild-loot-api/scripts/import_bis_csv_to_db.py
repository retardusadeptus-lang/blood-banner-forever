import csv
import os
import re
import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parent.parent


def resolve_path(env_var: str, default: Path) -> Path:
    raw_value = os.environ.get(env_var)
    if not raw_value:
        return default

    candidate = Path(raw_value)
    if candidate.is_absolute():
        return candidate
    return root / candidate


csv_path = resolve_path('BIS_CSV_PATH', root / 'BIS Lists' / 'all-bis-items.csv')
db_path = resolve_path('GUILD_LOOT_DB_PATH', root / 'mydb.db')

if not csv_path.exists():
    raise FileNotFoundError(f'Missing CSV file: {csv_path}')

PHASE_MAP = {
    'pre-bis': 'preraid',
    'pre bis': 'preraid',
    'preraid': 'preraid',
    't4': 't4',
    't5': 't5',
    't6': 't6',
    'za': 'za',
    'zulaman': 'za',
    'zul\'aman': 'za',
    'swp': 'swp',
    'sunwell': 'swp',
    'sunwell plateau': 'swp',
}

SPEC_CLASS_HINTS = {
    'balance druid': 'Druid',
    'feral (tank)': 'Druid',
    'feral (dps)': 'Druid',
    'resto druid': 'Druid',
    'bm hunter': 'Hunter',
    'mm hunter': 'Hunter',
    'survival hunter': 'Hunter',
    'arcane mage': 'Mage',
    'fire mage': 'Mage',
    'frost mage': 'Mage',
    'holy paladin': 'Paladin',
    'prot paladin': 'Paladin',
    'ret paladin': 'Paladin',
    'discipline priest': 'Priest',
    'holy priest': 'Priest',
    'shadow priest': 'Priest',
    'combat rogue': 'Rogue',
    'assassination rogue': 'Rogue',
    'subtlety rogue': 'Rogue',
    'elemental shaman': 'Shaman',
    'enhance shaman': 'Shaman',
    'resto shaman': 'Shaman',
    'affliction warlock': 'Warlock',
    'demo warlock': 'Warlock',
    'destro warlock': 'Warlock',
    'arms warrior': 'Warrior',
    'fury warrior': 'Warrior',
    'prot warrior': 'Warrior',
}


def normalize_phase(value: str) -> str:
    return 'ongoing'


def normalize_item_name(value: str) -> str:
    text = re.sub(r'\s+', ' ', (value or '').strip())
    parts = text.split()
    if len(parts) >= 2 and len(parts) % 2 == 0:
        half = len(parts) // 2
        if parts[:half] == parts[half:]:
            return ' '.join(parts[:half])
    return text


def infer_class_for_spec(spec_name: str) -> str | None:
    normalized = normalize_phase(spec_name).lower()
    normalized = re.sub(r'\s+', ' ', normalized).strip().lower()
    return SPEC_CLASS_HINTS.get(normalized)


def ensure_spec(conn: sqlite3.Connection, spec_name: str) -> int:
    existing = conn.execute('SELECT id, class FROM specs WHERE lower(spec) = lower(?) LIMIT 1', (spec_name,)).fetchone()
    if existing:
        return existing[0]

    class_name = infer_class_for_spec(spec_name) or 'Unknown'
    cursor = conn.execute('INSERT INTO specs (class, spec) VALUES (?, ?)', (class_name, spec_name))
    return int(cursor.lastrowid)


def ensure_item(conn: sqlite3.Connection, item_name: str, phase: str) -> int:
    normalized_name = normalize_item_name(item_name)
    existing = conn.execute('SELECT id FROM items WHERE lower(name) = lower(?) LIMIT 1', (normalized_name,)).fetchone()
    if existing:
        conn.execute('UPDATE items SET phase = ? WHERE id = ?', (phase, existing[0]))
        return existing[0]

    cursor = conn.execute('INSERT INTO items (name, slot, phase, source, source_type) VALUES (?, ?, ?, ?, ?)', (normalized_name, None, phase, None, None))
    return int(cursor.lastrowid)


def upsert_bis_row(conn: sqlite3.Connection, item_id: int, spec_id: int, phase: str, is_bis: bool, is_opt: bool) -> None:
    phase_key = phase
    bis_col = f'{phase_key}_bis'
    opt_col = f'{phase_key}_opt'

    existing = conn.execute('SELECT id FROM items_bis WHERE item_id = ? AND spec_id = ?', (item_id, spec_id)).fetchone()
    if existing:
        conn.execute(f'UPDATE items_bis SET {bis_col} = ?, {opt_col} = ? WHERE id = ?', (1 if is_bis else 0, 1 if is_opt else 0, existing[0]))
    else:
        conn.execute(
            f'INSERT INTO items_bis (item_id, spec_id, {bis_col}, {opt_col}) VALUES (?, ?, ?, ?)',
            (item_id, spec_id, 1 if is_bis else 0, 1 if is_opt else 0)
        )


def upsert_priority_entry(conn: sqlite3.Connection, phase: str, item_name: str, spec_name: str, status: str) -> None:
    conn.execute(
        'INSERT OR REPLACE INTO bis_priority_entries (phase, item_name, spec_name, status) VALUES (?, ?, ?, ?)',
        (phase, item_name, spec_name, status)
    )


conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
conn.execute('PRAGMA foreign_keys = ON')

with csv_path.open(newline='', encoding='utf-8-sig') as handle:
    rows = list(csv.DictReader(handle))

print(f'Loaded {len(rows)} rows from {csv_path}')

processed = 0
skipped = 0
conn.execute('BEGIN')
try:
    for row in rows:
        rank = (row.get('rank') or '').strip()
        item_name = (row.get('item_name') or '').strip()
        spec_name = (row.get('class_spec') or '').strip()
        phase = normalize_phase(row.get('phase') or '')

        if not item_name or not spec_name:
            skipped += 1
            continue

        spec_id = ensure_spec(conn, spec_name)
        item_id = ensure_item(conn, item_name, phase)
        is_bis = rank.lower() == 'bis'
        is_opt = rank.lower() in {'option', 'opt', 'alt', 'alternative', 'pvp'} or not is_bis
        status = 'BiS' if is_bis else 'Opt'
        upsert_bis_row(conn, item_id, spec_id, phase, is_bis, is_opt)
        upsert_priority_entry(conn, phase, normalize_item_name(item_name), spec_name, status)
        processed += 1

    conn.commit()
except Exception:
    conn.rollback()
    raise
finally:
    conn.close()

print(f'Imported {processed} rows, skipped {skipped}')
