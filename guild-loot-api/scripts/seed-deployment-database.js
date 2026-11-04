const { ensureDatabaseReady } = require('../config/database/schema');

const SPEC_DEFINITIONS = Object.freeze([
  { class: 'Warrior', spec: 'Prot Warrior', slug: 'prot-warrior', color: '#C79C6E' },
  { class: 'Warrior', spec: 'Arms Warrior', slug: 'arms-warrior', color: '#C79C6E' },
  { class: 'Warrior', spec: 'Fury Warrior', slug: 'fury-warrior', color: '#C79C6E' },
  { class: 'Paladin', spec: 'Prot Paladin', slug: 'prot-paladin', color: '#F58CBA' },
  { class: 'Paladin', spec: 'Holy Paladin', slug: 'holy-paladin', color: '#F58CBA' },
  { class: 'Paladin', spec: 'Ret Paladin', slug: 'retribution-paladin', color: '#F58CBA' },
  { class: 'Hunter', spec: 'BM Hunter', slug: 'BM-hunter', color: '#ABD473' },
  { class: 'Hunter', spec: 'MM Hunter', slug: 'marksmanship-hunter', color: '#ABD473' },
  { class: 'Hunter', spec: 'Survival Hunter', slug: 'survival-hunter', color: '#ABD473' },
  { class: 'Shaman', spec: 'Elemental Shaman', slug: 'elemental-shaman', color: '#0070DE' },
  { class: 'Shaman', spec: 'Enhance Shaman', slug: 'enhancement-shaman', color: '#0070DE' },
  { class: 'Shaman', spec: 'Resto Shaman', slug: 'restoration-shaman', color: '#0070DE' },
  { class: 'Druid', spec: 'Balance Druid', slug: 'balance-druid', color: '#FF7D0A' },
  { class: 'Druid', spec: 'Feral (Tank)', slug: 'feral-tank-druid', color: '#FF7D0A' },
  { class: 'Druid', spec: 'Feral (DPS)', slug: 'feral-dps-druid', color: '#FF7D0A' },
  { class: 'Druid', spec: 'Resto Druid', slug: 'restoration-druid', color: '#FF7D0A' },
  { class: 'Rogue', spec: 'Combat Rogue', slug: 'combat-rogue', color: '#FFF569' },
  { class: 'Rogue', spec: 'Subtlety Rogue', slug: 'subtlety-rogue', color: '#FFF569' },
  { class: 'Rogue', spec: 'Assassination Rogue', slug: 'assassination-rogue', color: '#FFF569' },
  { class: 'Priest', spec: 'Holy Priest', slug: 'holy-priest', color: '#FFFFFF' },
  { class: 'Priest', spec: 'Discipline Priest', slug: 'discipline-priest', color: '#FFFFFF' },
  { class: 'Priest', spec: 'Shadow Priest', slug: 'shadow-priest', color: '#FFFFFF' },
  { class: 'Mage', spec: 'Arcane Mage', slug: 'arcane-mage', color: '#69CCF0' },
  { class: 'Mage', spec: 'Fire Mage', slug: 'fire-mage', color: '#69CCF0' },
  { class: 'Mage', spec: 'Frost Mage', slug: 'frost-mage', color: '#69CCF0' },
  { class: 'Warlock', spec: 'Destro Warlock', slug: 'destruction-warlock', color: '#8788EE' },
  { class: 'Warlock', spec: 'Demo Warlock', slug: 'demonology-warlock', color: '#8788EE' },
  { class: 'Warlock', spec: 'Affliction Warlock', slug: 'affliction-warlock', color: '#8788EE' }
]);

function seedDeploymentDatabase(db) {
  const findSpec = db.prepare(`
    SELECT id, slug, color
    FROM specs
    WHERE slug = ? OR (class = ? AND spec = ?)
    LIMIT 1
  `);
  const insertSpec = db.prepare(`
    INSERT INTO specs (class, spec, slug, color)
    VALUES (?, ?, ?, ?)
  `);
  const fillMissingMetadata = db.prepare(`
    UPDATE specs
    SET slug = CASE WHEN slug IS NULL OR TRIM(slug) = '' THEN ? ELSE slug END,
        color = CASE WHEN color IS NULL OR TRIM(color) = '' THEN ? ELSE color END
    WHERE id = ?
  `);

  return db.transaction(() => {
    let inserted = 0;
    let updated = 0;

    for (const definition of SPEC_DEFINITIONS) {
      const existing = findSpec.get(definition.slug, definition.class, definition.spec);

      if (!existing) {
        insertSpec.run(definition.class, definition.spec, definition.slug, definition.color);
        inserted += 1;
        continue;
      }

      const slugWasMissing = !existing.slug || existing.slug.trim() === '';
      const colorWasMissing = !existing.color || existing.color.trim() === '';
      if (slugWasMissing || colorWasMissing) {
        fillMissingMetadata.run(definition.slug, definition.color, existing.id);
        updated += 1;
      }
    }

    return { inserted, updated };
  })();
}

function run() {
  const { db, DB_PATH } = require('../config/db');

  try {
    ensureDatabaseReady(db);
    const result = seedDeploymentDatabase(db);
    console.log(
      `[DB seed] ${DB_PATH}: ${result.inserted} specs inserted, ${result.updated} existing specs completed.`
    );
  } finally {
    db.close();
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  SPEC_DEFINITIONS,
  seedDeploymentDatabase
};
