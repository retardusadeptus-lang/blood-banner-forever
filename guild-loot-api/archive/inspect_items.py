import sqlite3
import os

p = 'guild-loot-api/mydb.db'
print('exists', os.path.exists(p))
conn = sqlite3.connect(p)
cur = conn.cursor()
cur.execute('SELECT name FROM sqlite_master WHERE type="table" AND name="items"')
print('has items', cur.fetchone() is not None)
cur.execute("SELECT id, name, slot, source, source_type, wowhead_id FROM items WHERE lower(source) LIKE '%vashj%' OR lower(source_type) LIKE '%vashj%' LIMIT 20")
rows = cur.fetchall()
for row in rows:
    print(row)
print('---')
cur.execute('SELECT COUNT(*) FROM items WHERE source_type IS NOT NULL')
print('total rows with source_type', cur.fetchone()[0])
