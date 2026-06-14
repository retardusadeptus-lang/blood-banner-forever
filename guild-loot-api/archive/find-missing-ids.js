const Database = require('better-sqlite3');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, 'mydb.db'));

const TOKEN = 'EUkSXEG2AnY5QbfRcBiCYuAtpcmXNq2hcT'; // your Bearer token
const NAMESPACE = 'static-classic1x-eu';
const REGION = 'eu';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function searchItem(name) {
  try {
    const res = await axios.get(`https://${REGION}.api.blizzard.com/data/wow/search/item`, {
      params: {
        namespace: NAMESPACE,
        'name.en_US': name,
        orderby: 'id',
        _page: 1
      },
      headers: {
        Authorization: `Bearer ${TOKEN}`
      }
    });

    const results = res.data.results || [];
    if (results.length === 0) return null;

    // Find exact name match (case-insensitive) if multiple results come back
    const exactMatch = results.find(r =>
      r.data.name?.en_US?.toLowerCase() === name.toLowerCase()
    );
    const chosen = exactMatch || results[0];

    return {
      name: chosen.data.name?.en_US || name,
      media_id: chosen.data.media?.id || null
    };
  } catch (e) {
    console.error(`Error searching for "${name}":`, e.response?.status || e.message);
    return null;
  }
}

async function main() {
  const items = db.prepare('SELECT * FROM items WHERE wowhead_id IS NULL').all();
  console.log(`Found ${items.length} items missing wowhead_id`);

  const output = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`[${i + 1}/${items.length}] Searching: ${item.name}`);

    const result = await searchItem(item.name);

    if (result) {
      output.push({
        db_id: item.id,
        name: result.name,
        media_id: result.media_id
      });
    } else {
      output.push({
        db_id: item.id,
        name: item.name,
        media_id: null
      });
    }

    // Be polite to the API - small delay between requests
    await sleep(150);
  }

  fs.writeFileSync(
    path.join(__dirname, 'outputs2.json'),
    JSON.stringify(output, null, 2)
  );

  console.log(`Done. Wrote ${output.length} results to outputs2.json`);
  db.close();
}

main();