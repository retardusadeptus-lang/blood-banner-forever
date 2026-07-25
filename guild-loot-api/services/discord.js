const fetch = global.fetch || (() => { throw new Error('Fetch is not available in this Node runtime.'); });

function buildDiscordService({ siteUrl, webhookUrl }) {
  const DISCORD_WEBHOOK_URL = String(webhookUrl || '').trim();
  const SITE_URL = String(siteUrl || '').trim();
  const DEFAULT_AVATAR = 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_bag_10_green.jpg';

  async function postToDiscord(payload) {
    if (!DISCORD_WEBHOOK_URL) return;

    try {
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => '');
        console.error(`Discord webhook returned ${response.status}: ${bodyText}`);
      }
    } catch (error) {
      console.error('Discord webhook failed:', error.message || error);
    }
  }

  async function sendBankInventoryWebhook(items) {
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

    await postToDiscord({
      username: 'Guild Banker',
      avatar_url: DEFAULT_AVATAR,
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
    });
  }

  async function sendBankRequestWebhook({ player_name, item_name, quantity, reason }) {
    await postToDiscord({
      username: 'Guild Banker',
      avatar_url: DEFAULT_AVATAR,
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
    });
  }

  async function sendBankResolutionWebhook({ player_name, item_name, quantity, status, price, officer_note, approved_quantity }) {
    const isApproved = String(status || '').toLowerCase() === 'approved';
    const isPartial = isApproved && approved_quantity && Number(approved_quantity) < Number(quantity);

    await postToDiscord({
      username: 'Guild Banker',
      avatar_url: DEFAULT_AVATAR,
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
    });
  }

  async function sendBankBulkResolutionWebhook({ lines, title = '📦 Bank Basket Resolved' }) {
    await postToDiscord({
      username: 'Guild Banker',
      avatar_url: DEFAULT_AVATAR,
      embeds: [{
        title,
        color: 3447003,
        description: Array.isArray(lines) ? lines.join('\n') : 'No summary available.',
        timestamp: new Date().toISOString()
      }]
    });
  }

  return {
    sendBankInventoryWebhook,
    sendBankRequestWebhook,
    sendBankResolutionWebhook,
    sendBankBulkResolutionWebhook
  };
}

module.exports = { buildDiscordService };
