const { sendChannelMessage: sendDiscordChannelMessage } = require('./discordBot');

function buildDiscordService({
  siteUrl,
  bankChannelId,
  recruitmentChannelId,
  sendChannelMessage = sendDiscordChannelMessage
}) {
  const SITE_URL = String(siteUrl || '').trim();
  const BANK_CHANNEL_ID = String(bankChannelId || '').trim();
  const RECRUITMENT_CHANNEL_ID = String(recruitmentChannelId || '').trim();

  function buildDiscordMentionPayload(mentions = []) {
    const validMentions = [...new Set((mentions || [])
      .map(mention => String(mention || '').trim())
      .filter(mention => /^\d{17,20}$/.test(mention)))];
    if (validMentions.length === 0) return null;

    return {
      content: validMentions.map(id => `<@${id}>`).join(' '),
      allowedMentions: { parse: [], users: validMentions }
    };
  }

  async function sendToChannel(channelId, payload, label) {
    if (!String(channelId || '').trim()) {
      console.error(`[Discord] ${label} skipped: no channel ID is configured.`);
      return { sent: false, reason: 'missing-channel-id' };
    }

    return sendChannelMessage(channelId, payload, label);
  }

  async function sendBankInventoryNotification(items) {
    const sorted = [...items].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

    const getCategoryBlock = (category) => {
      const categoryItems = sorted.filter(item => String(item.category || '').toLowerCase() === String(category || '').toLowerCase());
      if (categoryItems.length === 0) return 'None';
      const topItems = categoryItems.slice(0, 15);
      let text = topItems.map(item => `**${item.count}x** ${item.name}`).join('\n');
      if (categoryItems.length > 15) {
        text += `\n*...and ${categoryItems.length - 15} more*`;
      }
      return text;
    };

    return sendToChannel(BANK_CHANNEL_ID, {
      allowedMentions: { parse: [] },
      embeds: [{
        title: '📦 Guild Bank Inventory Report',
        description: SITE_URL ? `[**Click here to view full inventory**](${SITE_URL})` : 'Guild bank inventory has been updated.',
        color: 3066993,
        fields: [
          { name: '🧪 Consumables', value: getCategoryBlock('Consumable'), inline: true },
          { name: '💎 Materials', value: getCategoryBlock('Materials'), inline: true },
          { name: '✔️ Gear', value: getCategoryBlock('Gear'), inline: true },
          { name: '📜 Patterns', value: getCategoryBlock('Recipe'), inline: true }
        ],
        timestamp: new Date().toISOString()
      }]
    }, 'bank inventory notification');
  }

  async function sendBankRequestNotification({ player_name, item_name, quantity, reason }) {
    return sendToChannel(BANK_CHANNEL_ID, {
      allowedMentions: { parse: [] },
      embeds: [{
        title: '📥 New Bank Request',
        color: 15844367,
        fields: [
          { name: 'Player', value: String(player_name || 'Unknown'), inline: true },
          { name: 'Item', value: String(item_name || 'Unknown'), inline: true },
          { name: 'Quantity', value: String(quantity || 0), inline: true },
          { name: 'Reason', value: String(reason || '_No reason given_') }
        ],
        timestamp: new Date().toISOString()
      }]
    }, 'bank request notification');
  }

  async function sendBankResolutionNotification({ player_name, item_name, quantity, status, price, officer_note, approved_quantity, requester_discord_user_id }) {
    const isApproved = String(status || '').toLowerCase() === 'approved';
    const isPartial = isApproved && approved_quantity && Number(approved_quantity) < Number(quantity);
    const mentionPayload = buildDiscordMentionPayload(requester_discord_user_id ? [requester_discord_user_id] : []);

    return sendToChannel(BANK_CHANNEL_ID, {
      ...(mentionPayload || { allowedMentions: { parse: [] } }),
      embeds: [{
        title: isApproved ? (isPartial ? '✔️ Bank Request Partially Approved' : '✅ Bank Request Approved') : '❌ Bank Request Denied',
        color: isApproved ? 3066993 : 15158332,
        fields: [
          { name: 'Player', value: String(player_name || 'Unknown'), inline: true },
          { name: 'Item', value: String(item_name || 'Unknown'), inline: true },
          { name: 'Requested', value: String(quantity || 0), inline: true },
          ...(isApproved ? [{ name: 'Approved', value: String(approved_quantity || quantity), inline: true }] : []),
          ...(isApproved && price ? [{ name: 'Price', value: `${price}g`, inline: true }] : []),
          ...(officer_note ? [{ name: isApproved ? 'Note' : 'Reason', value: String(officer_note) }] : [])
        ],
        timestamp: new Date().toISOString()
      }]
    }, 'bank resolution notification');
  }

  async function sendBankBulkResolutionNotification({ groups = [], mentions = [], title = '📦 Bank Basket Resolved' }) {
    const MAX_FIELD_LENGTH = 1024;
    const MAX_EMBED_LENGTH = 5800;
    const safeGroups = Array.isArray(groups) && groups.length > 0
      ? groups
      : [{ playerName: 'No items', entries: [{ statusIcon: '•', itemName: 'No items in summary', approvedQuantity: 0, requestedQuantity: 0, priceText: '', noteText: '' }] }];
    const mentionPayload = buildDiscordMentionPayload(mentions);

    const truncateText = (value, width) => {
      const text = String(value ?? '').replace(/\s+/g, ' ').trim();
      if (!width) return text;
      if (text.length <= width) return text;
      return `${text.slice(0, Math.max(0, width - 3))}...`;
    };

    const buildColumnValue = (formatter, { includePlayerName = true, includeSeparator = false } = {}, groupsToRender = safeGroups) => groupsToRender.map(group => {
      const lines = [];
      if (includePlayerName && group.playerName) {
        lines.push(`**${truncateText(group.playerName, 20)}**`);
      }

      (group.entries || []).forEach(entry => {
        const line = formatter(entry);
        if (line) {
          lines.push(line);
        }
      });

      if (!includePlayerName && includeSeparator) {
        const placeholderCount = Math.max(1, (group.entries || []).length > 0 ? 1 : 0);
        for (let i = 0; i < placeholderCount; i += 1) {
          lines.unshift('---');
        }
      }

      return lines.join('\n');
    }).join('\n\n');

    const buildFieldValues = groupsToRender => ({
      statusItemValue: buildColumnValue(entry => {
        const status = String(entry.statusIcon || '•');
        const item = truncateText(entry.itemName || '', 34);
        return `${status} ${item}`;
      }, {}, groupsToRender),
      countPriceValue: buildColumnValue(entry => {
        const requestedQuantity = entry.requestedQuantity != null ? String(entry.requestedQuantity) : '0';
        const approvedValue = entry.statusIcon === '❌' ? '0' : String(entry.approvedQuantity ?? 0);
        return `${approvedValue}/${requestedQuantity}`;
      }, { includePlayerName: false, includeSeparator: true }, groupsToRender),
      noteValue: buildColumnValue(entry => {
        const price = entry.priceText ? `${entry.priceText}` : ' ';
        const note = entry.noteText ? truncateText(entry.noteText, 240) : ' ';
        return price === ' ' ? note : `${price} • ${note}`;
      }, { includePlayerName: false, includeSeparator: true }, groupsToRender)
    });

    const fitsEmbed = groupsToRender => {
      const values = buildFieldValues(groupsToRender);
      return Object.values(values).every(value => value.length <= MAX_FIELD_LENGTH)
        && Object.values(values).reduce((total, value) => total + value.length, title.length) <= MAX_EMBED_LENGTH;
    };

    const pages = [];
    let page = [];
    const addGroupToPages = group => {
      const entries = Array.isArray(group.entries) ? group.entries : [];
      const groupChunks = [];
      let entryChunk = [];
      entries.forEach(entry => {
        const candidateEntries = [...entryChunk, entry];
        if (entryChunk.length > 0 && !fitsEmbed([{ ...group, entries: candidateEntries }])) {
          groupChunks.push(entryChunk);
          entryChunk = [entry];
        } else {
          entryChunk = candidateEntries;
        }
      });
      groupChunks.push(entryChunk);

      groupChunks.forEach((entriesForChunk, chunkIndex) => {
        const chunk = { ...group, entries: entriesForChunk };
        if (chunkIndex > 0) chunk.playerName = `${group.playerName || 'Unknown'} (continued)`;
        if (page.length > 0 && !fitsEmbed([...page, chunk])) {
          pages.push(page);
          page = [];
        }
        page.push(chunk);
      });
    };

    safeGroups.forEach(addGroupToPages);
    if (page.length > 0) pages.push(page);

    let sent = true;
    for (const [pageIndex, pageGroups] of pages.entries()) {
      const values = buildFieldValues(pageGroups);
      const result = await sendToChannel(BANK_CHANNEL_ID, {
        ...(pageIndex === 0 ? (mentionPayload || {}) : {}),
        ...(pageIndex > 0 || !mentionPayload ? { allowedMentions: { parse: [] } } : {}),
        embeds: [{
          title: pages.length > 1 ? `${title} (${pageIndex + 1}/${pages.length})` : title,
          color: 3447003,
          description: '',
          fields: [
            { name: '\u200b', value: values.statusItemValue, inline: true },
            { name: '\u200b', value: values.countPriceValue, inline: true },
            { name: '\u200b', value: values.noteValue, inline: true }
          ],
          timestamp: new Date().toISOString()
        }]
      }, 'bank bulk resolution notification');
      sent = result.sent && sent;
    }

    return { sent };
  }

  async function sendRecruitmentApplicationNotification({ event, application, previousStatus }) {
    const applicationName = String(application?.name || 'Unknown applicant').trim() || 'Unknown applicant';
    const normalizedEvent = String(event || 'updated').trim().toLowerCase();
    const eventDetails = {
      received: {
        title: `📝 New recruitment application: ${applicationName}`,
        color: 15548997
      },
      updated: {
        title: `✏️ Recruitment application updated: ${applicationName}`,
        color: 3447003
      },
      status_changed: {
        title: `📣 Recruitment application status changed: ${applicationName}`,
        color: 3066993
      },
      deleted: {
        title: `🗑️ Recruitment application deleted: ${applicationName}`,
        color: 15158332
      }
    }[normalizedEvent] || {
      title: `📣 Recruitment application update: ${applicationName}`,
      color: 3447003
    };

    const status = String(application?.status || 'pending');
    const fields = [
      { name: 'Class', value: String(application?.class_name || application?.className || 'Unknown'), inline: true },
      { name: 'Spec', value: String(application?.spec || 'Unknown'), inline: true },
      { name: 'Applicant', value: String(application?.battletag || application?.applicantBattletag || 'Unknown'), inline: true },
      { name: 'Status', value: status, inline: true }
    ];

    const discordId = String(application?.discord_id || application?.discordId || '').trim();
    if (discordId) {
      fields.push({ name: 'Discord ID', value: discordId, inline: true });
    }

    if (previousStatus && normalizedEvent === 'status_changed') {
      fields.push({ name: 'Previous status', value: String(previousStatus), inline: true });
    }

    if (application?.officer_note) {
      fields.push({ name: 'Officer note', value: String(application.officer_note).slice(0, 1000) });
    }

    if (normalizedEvent !== 'deleted') {
      fields.push({
        name: 'About Me',
        value: String(application?.about_me || application?.aboutMe || '_No information provided_').slice(0, 1000)
      });
    }

    return sendToChannel(RECRUITMENT_CHANNEL_ID, {
      allowedMentions: { parse: [] },
      embeds: [{
        title: eventDetails.title,
        color: eventDetails.color,
        fields,
        timestamp: new Date().toISOString()
      }]
    }, 'recruitment application notification');
  }

  return {
    sendBankInventoryNotification,
    sendBankRequestNotification,
    sendBankResolutionNotification,
    sendBankBulkResolutionNotification,
    sendRecruitmentApplicationNotification
  };
}

module.exports = { buildDiscordService };
