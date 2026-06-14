-- Add icon columns
ALTER TABLE specs ADD COLUMN icon_medium VARCHAR(255);
ALTER TABLE specs ADD COLUMN icon_large VARCHAR(255);
ALTER TABLE specs ADD COLUMN icon_small VARCHAR(255);

-- Update existing specs with icon URLs
UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/inv_shield_06.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/inv_shield_06.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/inv_shield_06.jpg'
WHERE spec = 'Prot Warrior';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/ability_warrior_savageblow.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/ability_warrior_savageblow.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/ability_warrior_savageblow.jpg'
WHERE spec = 'Arms Warrior';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/ability_warrior_innerrage.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/ability_warrior_innerrage.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/ability_warrior_innerrage.jpg'
WHERE spec = 'Fury Warrior';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_devotionaura.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_devotionaura.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_holy_devotionaura.jpg'
WHERE spec = 'Prot Paladin';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_holybolt.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_holybolt.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_holy_holybolt.jpg'
WHERE spec = 'Holy Paladin';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_auraoflight.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_auraoflight.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_holy_auraoflight.jpg'
WHERE spec = 'Ret Paladin';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/ability_hunter_beasttaming.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/ability_hunter_beasttaming.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/ability_hunter_beasttaming.jpg'
WHERE spec = 'BM Hunter';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/ability_marksmanship.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/ability_marksmanship.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/ability_marksmanship.jpg'
WHERE spec = 'MM Hunter';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/ability_hunter_swiftstrike.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/ability_hunter_swiftstrike.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/ability_hunter_swiftstrike.jpg'
WHERE spec = 'Survival Hunter';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_lightning.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_lightning.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_nature_lightning.jpg'
WHERE spec = 'Elemental Shaman';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_lightningshield.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_lightningshield.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_nature_lightningshield.jpg'
WHERE spec = 'Enhance Shaman';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_magicimmunity.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_magicimmunity.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_nature_magicimmunity.jpg'
WHERE spec = 'Resto Shaman';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_starfall.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_starfall.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_nature_starfall.jpg'
WHERE spec = 'Balance Druid';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/ability_racial_bearform.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/ability_racial_bearform.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/ability_racial_bearform.jpg'
WHERE spec = 'Feral (Tank)';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/ability_druid_catform.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/ability_druid_catform.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/ability_druid_catform.jpg'
WHERE spec = 'Feral (DPS)';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_nature_healingtouch.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_healingtouch.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_nature_healingtouch.jpg'
WHERE spec = 'Resto Druid';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/ability_backstab.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/ability_backstab.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/ability_backstab.jpg'
WHERE spec = 'Combat Rogue';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_guardianspirit.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_guardianspirit.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_holy_guardianspirit.jpg'
WHERE spec = 'Holy Priest';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_shadowwordpain.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_shadowwordpain.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_shadow_shadowwordpain.jpg'
WHERE spec = 'Shadow Priest';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_magicalsentry.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_magicalsentry.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_holy_magicalsentry.jpg'
WHERE spec = 'Arcane Mage';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_fire_firebolt02.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_firebolt02.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_fire_firebolt02.jpg'
WHERE spec = 'Fire Mage';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_frost_frostbolt02.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_frost_frostbolt02.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_frost_frostbolt02.jpg'
WHERE spec = 'Frost Mage';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_rainoffire.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_rainoffire.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_shadow_rainoffire.jpg'
WHERE spec = 'Destro Warlock';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_metamorphosis.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_metamorphosis.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_shadow_metamorphosis.jpg'
WHERE spec = 'Demo Warlock';

UPDATE specs SET 
  icon_medium = 'https://wow.zamimg.com/images/wow/icons/medium/spell_shadow_deathcoil.jpg',
  icon_large = 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_deathcoil.jpg',
  icon_small = 'https://wow.zamimg.com/images/wow/icons/small/spell_shadow_deathcoil.jpg'
WHERE spec = 'Affliction Warlock';

-- Insert missing specs
INSERT INTO specs (class, spec, icon_medium, icon_large, icon_small) VALUES
('Rogue', 'Subtlety Rogue', 
  'https://wow.zamimg.com/images/wow/icons/medium/ability_stealth.jpg',
  'https://wow.zamimg.com/images/wow/icons/large/ability_stealth.jpg',
  'https://wow.zamimg.com/images/wow/icons/small/ability_stealth.jpg'),
('Rogue', 'Assassination Rogue',
  'https://wow.zamimg.com/images/wow/icons/medium/ability_rogue_eviscerate.jpg',
  'https://wow.zamimg.com/images/wow/icons/large/ability_rogue_eviscerate.jpg',
  'https://wow.zamimg.com/images/wow/icons/small/ability_rogue_eviscerate.jpg'),
('Priest', 'Discipline Priest',
  'https://wow.zamimg.com/images/wow/icons/medium/spell_holy_wordfortitude.jpg',
  'https://wow.zamimg.com/images/wow/icons/large/spell_holy_wordfortitude.jpg',
  'https://wow.zamimg.com/images/wow/icons/small/spell_holy_wordfortitude.jpg');

  