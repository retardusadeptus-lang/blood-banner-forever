-- Add color column to specs table
ALTER TABLE specs ADD COLUMN color VARCHAR(7);

-- Update specs with WoW class colors
UPDATE specs SET color = '#C79C6E' WHERE spec IN ('Prot Warrior', 'Arms Warrior', 'Fury Warrior');
UPDATE specs SET color = '#F58CBA' WHERE spec IN ('Prot Paladin', 'Holy Paladin', 'Ret Paladin');
UPDATE specs SET color = '#ABD473' WHERE spec IN ('BM Hunter', 'MM Hunter', 'Survival Hunter');
UPDATE specs SET color = '#FFF569' WHERE spec = 'Combat Rogue';
UPDATE specs SET color = '#FFF569' WHERE spec IN ('Subtlety Rogue', 'Assassination Rogue');
UPDATE specs SET color = '#FFFFFF' WHERE spec IN ('Holy Priest', 'Discipline Priest', 'Shadow Priest');
UPDATE specs SET color = '#0070DE' WHERE spec IN ('Elemental Shaman', 'Enhance Shaman', 'Resto Shaman');
UPDATE specs SET color = '#69CCF0' WHERE spec IN ('Arcane Mage', 'Fire Mage', 'Frost Mage');
UPDATE specs SET color = '#8788EE' WHERE spec IN ('Destro Warlock', 'Demo Warlock', 'Affliction Warlock');
UPDATE specs SET color = '#FF7D0A' WHERE spec IN ('Balance Druid', 'Feral (Tank)', 'Feral (DPS)', 'Resto Druid');
