function createTokenRedemptionService(db) {
  function getTokenRedemptionByItemId(itemId) {
    const tokenMeta = db.prepare(`
      SELECT
        t.token_item_id,
        i.name as token_name,
        t.token_group,
        t.token_slot,
        t.phase_key,
        t.classes_json,
        t.is_quest
      FROM tier_token_metadata t
      JOIN items i ON i.id = t.token_item_id
      WHERE t.token_item_id = ?
    `).get(itemId);

    if (!tokenMeta) return null;

    const allowedClasses = JSON.parse(tokenMeta.classes_json || '[]').map(cls => String(cls).toLowerCase());
    let redeemableItems = [];

    if (tokenMeta.is_quest === 1) {
      redeemableItems = db.prepare(`
        SELECT reward_name as name, reward_wowhead_id as wowhead_id
        FROM tier_token_reward_items
        WHERE token_item_id = ?
        ORDER BY reward_name
      `).all(itemId);
    } else if (allowedClasses.length > 0) {
      const classPlaceholders = allowedClasses.map(() => '?').join(',');
      redeemableItems = db.prepare(`
        SELECT DISTINCT
          i.id,
          i.name,
          i.wowhead_id
        FROM items i
        JOIN items_bis ib ON ib.item_id = i.id
        JOIN specs s ON s.id = ib.spec_id
        WHERE lower(i.slot) = ?
          AND lower(i.phase) = ?
          AND lower(s.class) IN (${classPlaceholders})
          AND (
            ib.preraid_bis = 1 OR ib.t4_bis = 1 OR ib.t5_bis = 1 OR ib.t6_bis = 1 OR ib.za_bis = 1 OR ib.swp_bis = 1 OR
            ib.preraid_opt = 1 OR ib.t4_opt = 1 OR ib.t5_opt = 1 OR ib.t6_opt = 1 OR ib.za_opt = 1 OR ib.swp_opt = 1
          )
        ORDER BY i.name
      `).all(tokenMeta.token_slot, tokenMeta.phase_key, ...allowedClasses);
    }

    return {
      tokenItemId: tokenMeta.token_item_id,
      tokenName: tokenMeta.token_name,
      tokenGroup: tokenMeta.token_group,
      tokenSlot: tokenMeta.token_slot,
      phaseKey: tokenMeta.phase_key,
      classes: JSON.parse(tokenMeta.classes_json || '[]'),
      isQuest: tokenMeta.is_quest === 1,
      redeemableItems
    };
  }

  return { getTokenRedemptionByItemId };
}

module.exports = createTokenRedemptionService;
