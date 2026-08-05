import { useEffect, useState } from 'react';
import { downloadCsv } from '../utils/csv';

const BANK_SYNC_INTERVAL_MS = 20000;
const CATEGORY_MAP = {
  Bank: 'Bank',
  Consumables: 'Consumables',
  Gear: 'Gear',
  Misc: 'Misc'
};

export default function useBankData({ fetchData, putData, isAuthenticated }) {
  const [bankItems, setBankItems] = useState([]);
  const [bankRequests, setBankRequests] = useState([]);
  const [bankSearch, setBankSearch] = useState('');
  const [bankArchivedRequestIds, setBankArchivedRequestIds] = useState(() => JSON.parse(localStorage.getItem('bank-archived-request-ids') || '[]'));
  const [bankUploadParsed, setBankUploadParsed] = useState(null);
  const [bankUploadStatus, setBankUploadStatus] = useState('');
  const [bankUploadMeta, setBankUploadMeta] = useState({ gold: null });
  const [bankContentsHistory, setBankContentsHistory] = useState(() => JSON.parse(localStorage.getItem('bank-contents-history') || '[]'));

  useEffect(() => {
    localStorage.setItem('bank-archived-request-ids', JSON.stringify(bankArchivedRequestIds));
  }, [bankArchivedRequestIds]);

  useEffect(() => {
    localStorage.setItem('bank-contents-history', JSON.stringify(bankContentsHistory));
  }, [bankContentsHistory]);

  useEffect(() => {
    let mounted = true;
    const loadBankData = async () => {
      if (document.hidden) return;
      try {
        const items = await fetchData('bank-items');
        if (!mounted) return;
        setBankItems(items);
        if (isAuthenticated) {
          const requests = await fetchData('bank-requests');
          if (!mounted) return;
          setBankRequests(requests);
        }
      } catch (e) {
        console.error('Failed to load bank data:', e);
      }
    };
    loadBankData();
    const interval = setInterval(loadBankData, BANK_SYNC_INTERVAL_MS);
    return () => { mounted = false; clearInterval(interval); };
  }, [fetchData, isAuthenticated]);

  const handleUploadBankLuaFile = (file, setBankUploadStatusLocal = () => {}) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const parsed = [];

      const idRegex = /\[(\d+)\]\s*=\s*\{/g;
      let match;

      while ((match = idRegex.exec(text)) !== null) {
        const id = match[1];
        const restOfFile = text.substring(match.index);
        const closingBracket = restOfFile.indexOf('},');
        const itemDataStr = restOfFile.substring(0, closingBracket);

        const countMatch = itemDataStr.match(/\["count"\]\s*=\s*(\d+)/);
        const count = countMatch ? parseInt(countMatch[1]) : 1;

        const nameMatch = itemDataStr.match(/\["name"\]\s*=\s*"([^"]+)"/);
        const name = nameMatch ? nameMatch[1] : 'Unknown Item';

        const catMatch = itemDataStr.match(/\["category"\]\s*=\s*"([^"]+)"/);
        const rawCat = catMatch ? catMatch[1] : 'Misc';
        const cleanCat = CATEGORY_MAP[rawCat] || 'Misc';

        const subTypeMatch = itemDataStr.match(/\["subtype"\]\s*=\s*"([^"]+)"/);
        const subType = subTypeMatch ? subTypeMatch[1] : '';

        parsed.push({
          item_wowhead_id: parseInt(id),
          count,
          name,
          category: cleanCat,
          sub_type: subType
        });
      }

      const goldMatch = text.match(/\["(?:gold|guildGold|bankGold)"\]\s*=\s*(\d+)/);
      const parsedGold = goldMatch ? parseInt(goldMatch[1], 10) : null;
      setBankUploadMeta({ gold: parsedGold });
      setBankUploadStatus(parsed.length === 0 ? '⚠️ Found 0 items. Check your Lua file.' : `✅ Loaded ${parsed.length} items. Click Save to update the bank.`);
      setBankUploadParsed(parsed.length === 0 ? null : parsed);
      setBankUploadStatusLocal && setBankUploadStatusLocal(bankUploadStatus);
    };
    reader.readAsText(file);
  };

  const handleParseBankUpdateJson = (bankUpdateJsonText) => {
    try {
      const parsedData = JSON.parse(bankUpdateJsonText || '{}');
      const items = Array.isArray(parsedData.bankItems)
        ? parsedData.bankItems
        : Array.isArray(parsedData.items)
          ? parsedData.items
          : Array.isArray(parsedData.data)
            ? parsedData.data
            : [];

      const normalized = items.map(item => ({
        item_wowhead_id: Number(item.item_wowhead_id ?? item.id ?? item.itemId) || 0,
        count: Number(item.count ?? item.quantity ?? 0) || 0,
        name: item.name || item.item_name || '',
        category: item.category || item.cat || '',
        sub_type: item.sub_type || item.subtype || item.subType || ''
      })).filter(item => item.item_wowhead_id > 0);

      if (normalized.length === 0) {
        setBankUploadStatus('⚠️ No valid bank items found in JSON.');
        setBankUploadParsed(null);
        return;
      }

      const parsedGold = Number(parsedData.gold ?? parsedData.guildGold ?? parsedData.bankGold ?? parsedData.guild_gold ?? parsedData.guildGoldCopper ?? 0);
      setBankUploadMeta({ gold: Number.isFinite(parsedGold) ? parsedGold : null });
      setBankUploadParsed(normalized);
      setBankUploadStatus(`✅ Loaded ${normalized.length} items from JSON. Click Save to update the bank.`);
    } catch (error) {
      setBankUploadStatus('❌ Invalid JSON. Please paste the exported blob from the addon.');
      setBankUploadParsed(null);
    }
  };

  const handleSaveBankUpload = async () => {
    if (!bankUploadParsed) return;
    setBankUploadStatus('Uploading...');
    try {
      const payload = Array.isArray(bankUploadParsed) ? bankUploadParsed : (bankUploadParsed.items || []);
      const data = await putData('bank-items', payload);
      const snapshot = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        itemCount: Array.isArray(payload) ? payload.length : 0,
        gold: bankUploadMeta?.gold ?? null,
        items: payload
      };
      setBankContentsHistory(prev => [snapshot, ...prev].slice(0, 12));
      setBankUploadStatus(`✅ Bank updated with ${data.count} items! Discord notified.`);
      setBankUploadParsed(null);
      setBankUploadMeta({ gold: null });
      const items = await fetchData('bank-items');
      setBankItems(items);
    } catch (e) {
      setBankUploadStatus('❌ Error uploading.');
    }
  };

  const exportBankContentsHistoryCsv = () => {
    const headers = ['snapshot_id', 'timestamp', 'gold', 'item_wowhead_id', 'name', 'count', 'category', 'sub_type'];
    const rows = bankContentsHistory.flatMap(snapshot => (
      Array.isArray(snapshot.items) && snapshot.items.length > 0
        ? snapshot.items.map(item => [
            snapshot.id,
            snapshot.timestamp,
            snapshot.gold,
            item.item_wowhead_id,
            item.name,
            item.count ?? item.quantity,
            item.category,
            item.sub_type
          ])
        : [[snapshot.id, snapshot.timestamp, snapshot.gold, '', '', '', '', '']]
    ));
    downloadCsv(`bank-contents-history-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`, headers, rows);
  };

  return {
    bankItems,
    bankRequests,
    bankSearch,
    setBankSearch,
    bankArchivedRequestIds,
    setBankArchivedRequestIds,
    bankUploadParsed,
    bankUploadStatus,
    bankUploadMeta,
    setBankUploadMeta,
    handleUploadBankLuaFile,
    handleParseBankUpdateJson,
    handleSaveBankUpload,
    bankContentsHistory,
    setBankContentsHistory,
    exportBankContentsHistoryCsv,
    setBankItems,
    setBankRequests
  };
}
