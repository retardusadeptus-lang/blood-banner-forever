const {
  getEventById,
  getAllowedSpecsByClass,
  getDraft,
  upsertDraft,
  upsertUserPreferredSpec,
  upsertUserPreferredClass,
  upsertUserPreferredCharacter,
  getUserPreferredSpec,
  getUserPreferredClass,
  getUserPreferredCharacter,
  upsertSignupEntry,
  setEventClassFilter
} = require('../utils/raidSignupStore');
const { refreshEventMessage } = require('./raidSignupEmbed');

async function handleSpecSelect(interaction, db, eventId) {
  const event = getEventById(db, eventId);
  if (!event || event.status !== 'open') {
    await interaction.update({ content: 'This signup event is closed.', components: [] });
    return true;
  }

  const specId = Number(interaction.values?.[0] || 0);
  if (!specId) {
    await interaction.update({ content: 'Invalid spec selection.', components: interaction.message.components });
    return true;
  }

  try {
    await interaction.deferUpdate();

    upsertDraft(db, eventId, interaction.user.id, specId);
    upsertUserPreferredSpec(db, interaction.user.id, specId);

    await refreshEventMessage(db, interaction.client, eventId, interaction.user.id);
  } catch (error) {
    console.error('[RaidSignup] Failed to update spec selection:', error);
  }

  return true;
}

async function handleClassFilterSelect(interaction, db, eventId) {
  const event = getEventById(db, eventId);
  if (!event || event.status !== 'open') {
    await interaction.reply({ content: 'This signup event is closed.', ephemeral: true });
    return true;
  }

  const className = String(interaction.values?.[0] || '').trim();
  if (!className || className === 'none') {
    await interaction.reply({ content: 'Invalid class selection.', ephemeral: true });
    return true;
  }

  try {
    const classSpecs = getAllowedSpecsByClass(db, eventId, className);
    if (!classSpecs.length) {
      await interaction.reply({ content: `No specs found for ${className}.`, ephemeral: true });
      return true;
    }

    const currentDraft = getDraft(db, eventId, interaction.user.id);
    const currentDraftSpec = Number(currentDraft?.spec_id || 0);
    const preferredSpec = Number(getUserPreferredSpec(db, interaction.user.id)?.spec_id || 0);

    const hasDraftInClass = classSpecs.some(spec => Number(spec.id) === currentDraftSpec);
    const hasPreferredInClass = classSpecs.some(spec => Number(spec.id) === preferredSpec);
    const nextSpecId = hasDraftInClass
      ? currentDraftSpec
      : (hasPreferredInClass ? preferredSpec : Number(classSpecs[0].id));

    upsertDraft(db, eventId, interaction.user.id, nextSpecId);
    upsertUserPreferredSpec(db, interaction.user.id, nextSpecId);
    upsertUserPreferredClass(db, interaction.user.id, className, nextSpecId);
    setEventClassFilter(db, eventId, className);

    const selectedSpec = classSpecs.find(spec => Number(spec.id) === Number(nextSpecId));
    await interaction.deferUpdate();
    interaction.deferred = true;
    await refreshEventMessage(db, interaction.client, eventId, interaction.user.id);
    if (selectedSpec) {
      console.log(`[RaidSignup] Updated class for user ${interaction.user.id} to ${className}; spec set to ${selectedSpec.spec}.`);
    }
  } catch (error) {
    console.error('[RaidSignup] Failed to handle class selection:', error);
    try {
      const wasAcknowledged = Boolean(interaction.deferred || interaction.replied || interaction.isDeferred?.());
      if (!wasAcknowledged) {
        await interaction.reply({ content: 'There was a problem updating your class selection.', ephemeral: true });
      }
    } catch (replyError) {
      console.error('[RaidSignup] Failed to send class selection error reply:', replyError);
    }
  }

  return true;
}

async function handleStatusButton(interaction, db, eventId, status) {
  const event = getEventById(db, eventId);
  if (!event || event.status !== 'open') {
    await interaction.reply({ content: 'This signup event is closed.', ephemeral: true });
    return true;
  }

  const normalizedStatus = String(status || '').toLowerCase();
  const allowed = new Set(['signup', 'bench', 'late', 'tentative', 'absence']);
  if (!allowed.has(normalizedStatus)) {
    await interaction.reply({ content: 'Unknown status action.', ephemeral: true });
    return true;
  }

  const preferredCharacter = String(getUserPreferredCharacter(db, interaction.user.id)?.character_name || '').trim();
  if (!preferredCharacter) {
    await interaction.reply({
      content: 'Please set your character name before signing up.',
      ephemeral: true
    });
    return true;
  }

  let specId = null;
  const draft = getDraft(db, eventId, interaction.user.id);
  if (draft?.spec_id) specId = Number(draft.spec_id);
  if (!specId) {
    const existing = db.prepare(`
      SELECT spec_id, status
      FROM raid_signup_entries
      WHERE event_id = ? AND discord_user_id = ?
      LIMIT 1
    `).get(eventId, interaction.user.id);
    if (existing?.spec_id) specId = Number(existing.spec_id);
  }
  if (!specId) {
    const preferred = getUserPreferredSpec(db, interaction.user.id);
    if (preferred?.spec_id) specId = Number(preferred.spec_id);
  }

  if (normalizedStatus === 'signup' && !specId) {
    await interaction.reply({
      content: 'Select a spec first in the class menu, then click Sign Up.',
      ephemeral: true
    });
    return true;
  }

  const displayName = preferredCharacter || (interaction.member?.displayName || interaction.user.username);
  upsertSignupEntry(db, eventId, interaction.user.id, displayName, normalizedStatus, specId);
  if (specId) {
    upsertUserPreferredSpec(db, interaction.user.id, specId);
  }

  await interaction.deferUpdate();
  await refreshEventMessage(db, interaction.client, eventId, interaction.user.id);

  return true;
}

async function handleCharacterNameSubmit(interaction, db, eventId) {
  const event = getEventById(db, eventId);
  if (!event || event.status !== 'open') {
    await interaction.reply({ content: 'This signup event is closed.', ephemeral: true });
    return true;
  }

  const characterName = String(interaction.fields?.getTextInputValue('character_name') || '').trim();
  if (!characterName) {
    await interaction.reply({ content: 'Character name is required.', ephemeral: true });
    return true;
  }

  upsertUserPreferredCharacter(db, interaction.user.id, characterName);

  await interaction.reply({
    content: `Saved character name as ${characterName}.`,
    ephemeral: true
  });

  await refreshEventMessage(db, interaction.client, eventId, interaction.user.id);
  return true;
}

module.exports = {
  handleSpecSelect,
  handleClassFilterSelect,
  handleStatusButton,
  handleCharacterNameSubmit
};
