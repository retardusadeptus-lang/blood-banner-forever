const { EmbedBuilder } = require('discord.js');
const { resolveClassEmojiToken } = require('../../utils/discordEmojiTokens');
const { formatSignupSummary } = require('../../utils/raidSignupStore');

function withEmoji(icon, label) {
  return icon ? `${icon} ${label}` : label;
}

function summarizeGroups(groups, guild) {
  if (!groups.length) return 'No groups assigned yet.';

  const byGroup = new Map();
  groups.forEach(row => {
    if (!byGroup.has(row.group_number)) byGroup.set(row.group_number, []);
    byGroup.get(row.group_number).push(row);
  });

  const lines = [];
  [...byGroup.keys()].sort((a, b) => a - b).forEach(groupNumber => {
    const rows = byGroup.get(groupNumber).sort((a, b) => a.slot_index - b.slot_index);
    const groupName = String(rows[0]?.group_name || '').trim() || `Group ${groupNumber}`;
    const body = rows.map(slot => {
      const classIcon = resolveClassEmojiToken(guild, slot?.spec_class);
      const specTag = slot.spec_name ? `[${slot.spec_name}] ` : '';
      const note = slot.note ? ` - ${slot.note}` : '';
      return `${slot.slot_index}. ${classIcon ? `${classIcon} ` : ''}${specTag}${slot.player_name}${note}`;
    }).join('\n');
    lines.push(`${groupName}\n${body}`);
  });

  return lines.join('\n\n');
}

function buildEchoEmbed(interaction, event, entries, groups) {
  const summary = formatSignupSummary(entries, {
    classIconResolver: entry => {
      const token = resolveClassEmojiToken(interaction.guild || null, entry?.spec_class);
      return token ? `${token} ` : '';
    }
  });

  const tankCount = summary.roleBuckets.tank.length;
  const healerCount = summary.roleBuckets.healer.length;
  const meleeCount = summary.roleBuckets.melee.length;
  const rangedCount = summary.roleBuckets.ranged.length;
  const available = tankCount + healerCount + meleeCount + rangedCount;
  const lateOrTentative = summary.statuses.late.length + summary.statuses.tentative.length;
  const summaryLine = [
    `Available: ${available}${lateOrTentative > 0 ? `(+${lateOrTentative})` : ''}`,
    `Bench: ${summary.statuses.bench.length}`,
    `Late: ${summary.statuses.late.length}`,
    `Tentative: ${summary.statuses.tentative.length}`,
    `Absence: ${summary.statuses.absence.length}`
  ].join(' | ');

  return new EmbedBuilder()
    .setTitle(`Raid Echo: ${event.title}`)
    .setDescription(event.description || 'Raid signup echo')
    .addFields(
      { name: 'Sign Summary', value: summaryLine, inline: false },
      { name: withEmoji(resolveClassEmojiToken(interaction.guild || null, 'tank'), `Tank (${tankCount})`), value: summary.roleBuckets.tank.join('\n') || 'None', inline: true },
      { name: withEmoji(resolveClassEmojiToken(interaction.guild || null, 'healer'), `Healer (${healerCount})`), value: summary.roleBuckets.healer.join('\n') || 'None', inline: true },
      { name: withEmoji(resolveClassEmojiToken(interaction.guild || null, 'melee'), `DPS (Melee) (${meleeCount})`), value: summary.roleBuckets.melee.join('\n') || 'None', inline: true },
      { name: withEmoji(resolveClassEmojiToken(interaction.guild || null, 'ranged'), `DPS (Ranged) (${rangedCount})`), value: summary.roleBuckets.ranged.join('\n') || 'None', inline: true },
      { name: 'Groups', value: summarizeGroups(groups, interaction.guild || null), inline: false }
    )
    .setColor(0x8e44ad)
    .setTimestamp();
}

module.exports = {
  buildEchoEmbed
};
