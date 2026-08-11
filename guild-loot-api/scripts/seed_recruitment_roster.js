const { db, DB_PATH } = require('../config/db');
const { ensureDatabaseReady } = require('../config/database/schema');

function getMultiplicity(spec) {
  const className = String(spec.class || '').toLowerCase();
  const specName = String(spec.spec || '').toLowerCase();

  if (className === 'warrior' && specName.includes('protection')) return 3;
  if (specName.includes('protection')) return 2;
  if (specName.includes('holy') || specName.includes('restoration')) return 2;
  if (specName.includes('destruction') || specName.includes('fury')) return 2;
  return 1;
}

function normalizeToken(value) {
  return String(value || '')
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

function makeName(spec, index) {
  const classToken = normalizeToken(spec.class);
  const specToken = normalizeToken(spec.spec);
  return `${classToken}${specToken}${index}`;
}

function seedRecruitmentRoster({ replace = true } = {}) {
  ensureDatabaseReady(db);

  const specs = db.prepare('SELECT id, class, spec FROM specs ORDER BY class, spec').all();
  if (!Array.isArray(specs) || specs.length === 0) {
    throw new Error('No specs found. Seed specs first, then run this script.');
  }

  const existingNames = new Set(
    db.prepare('SELECT name FROM roster').all().map(row => String(row.name || '').toLowerCase())
  );

  const insertRoster = db.prepare('INSERT INTO roster (name, spec_id, in_raid) VALUES (?, ?, 1)');

  const seedTx = db.transaction(() => {
    if (replace) {
      db.prepare('DELETE FROM roster').run();
      existingNames.clear();
    }

    let inserted = 0;
    const insertedBySpec = [];

    for (const spec of specs) {
      const multiplicity = getMultiplicity(spec);
      let createdForSpec = 0;

      for (let i = 1; i <= multiplicity; i += 1) {
        let attempt = i;
        let candidate = makeName(spec, attempt);
        while (existingNames.has(candidate.toLowerCase())) {
          attempt += 1;
          candidate = makeName(spec, attempt);
        }

        insertRoster.run(candidate, spec.id);
        existingNames.add(candidate.toLowerCase());
        inserted += 1;
        createdForSpec += 1;
      }

      insertedBySpec.push({ className: spec.class, specName: spec.spec, count: createdForSpec });
    }

    return { inserted, insertedBySpec };
  });

  return seedTx();
}

function main() {
  const args = process.argv.slice(2);
  const replace = !args.includes('--append');

  try {
    const result = seedRecruitmentRoster({ replace });
    console.log(`[seed] DB: ${DB_PATH}`);
    console.log(`[seed] mode: ${replace ? 'replace' : 'append'}`);
    console.log(`[seed] inserted roster rows: ${result.inserted}`);
    result.insertedBySpec.forEach(entry => {
      console.log(`[seed] ${entry.className} / ${entry.specName}: +${entry.count}`);
    });
  } catch (error) {
    console.error('[seed] failed:', error.message || error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
