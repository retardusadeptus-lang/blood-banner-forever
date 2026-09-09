import { useEffect, useMemo, useState } from 'react';
import { downloadCsv } from '../utils/csv';
import { CATEGORY_MAP } from '../constants';

const BANK_SYNC_INTERVAL_MS = 20000;
const normalizeBankCategory = category => CATEGORY_MAP[category] || category || 'Other';
const normalizeBankItems = items => (Array.isArray(items) ? items : []).map(item => ({
  ...item,
  category: normalizeBankCategory(item.category)
}));

export default function useBankData({ fetchData, putData, deleteData, isAuthenticated }) {
  const [bankItems, setBankItems] = useState([]);
  const [bankItemHistory, setBankItemHistory] = useState([]);
  const [bankRequests, setBankRequests] = useState([]);
  const [bankSearch, setBankSearch] = useState('');
  const [bankArchivedRequestIds, setBankArchivedRequestIds] = useState(() => JSON.parse(localStorage.getItem('bank-archived-request-ids') || '[]'));
  const [bankUpdateJsonText, setBankUpdateJsonText] = useState('');
  const [notifyBankUpdate, setNotifyBankUpdate] = useState(true);
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
        setBankItems(normalizeBankItems(items));
        const itemHistory = await fetchData('bank-item-history');
        if (!mounted) return;
        setBankItemHistory(normalizeBankItems(itemHistory));
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

  const handleParseBankUpdateJson = () => {
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
        category: normalizeBankCategory(item.category || item.cat),
        sub_type: item.sub_type || item.subtype || item.subType || ''
      })).filter(item => item.item_wowhead_id > 0);

      if (normalized.length === 0) {
        setBankUploadStatus('⚠️ No valid bank items found in JSON.');
        setBankUploadParsed(null);
        return;
      }

      const parsedMoney = Number(parsedData.gold ?? parsedData.guildGold ?? parsedData.bankGold ?? parsedData.guild_gold ?? parsedData.guildGoldCopper ?? 0);
      const parsedGold = Number.isFinite(parsedMoney) ? parsedMoney / 10000 : null;
      setBankUploadMeta({ gold: parsedGold });
      setBankUploadParsed(normalized);
      setBankUploadStatus(`✅ Loaded ${normalized.length} items from JSON. Click Save to update the bank.`);
    } catch {
      setBankUploadStatus('❌ Invalid JSON. Please paste the exported blob from the addon.');
      setBankUploadParsed(null);
    }
  };

  const handleSaveBankUpload = async () => {
    if (!bankUploadParsed) return;
    setBankUploadStatus('Uploading...');
    try {
      const payload = Array.isArray(bankUploadParsed) ? bankUploadParsed : (bankUploadParsed.items || []);
      const data = await putData('bank-items', { items: payload, notifyDiscord: notifyBankUpdate });
      const snapshot = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        itemCount: Array.isArray(payload) ? payload.length : 0,
        gold: bankUploadMeta?.gold ?? null,
        items: payload
      };
      setBankContentsHistory(prev => [snapshot, ...prev].slice(0, 12));
      setBankUploadStatus(`✅ Bank updated with ${data.count} items!${data.discordNotified ? ' Discord notified.' : ' Discord notification skipped.'}`);
      setBankUploadParsed(null);
      setBankUploadMeta({ gold: null });
      const items = await fetchData('bank-items');
      setBankItems(normalizeBankItems(items));
      const itemHistory = await fetchData('bank-item-history');
      setBankItemHistory(normalizeBankItems(itemHistory));
    } catch {
      setBankUploadStatus('❌ Error uploading.');
    }
  };

  const handleRestoreBankItem = async (itemWowheadId, quantity) => {
    const result = await putData(`bank-item-history/${itemWowheadId}/restore`, { quantity });
    setBankItems(prev => {
      const existing = prev.find(item => Number(item.item_wowhead_id) === Number(itemWowheadId));
      if (existing) {
        return prev.map(item => item === existing ? { ...item, count: result.item.count } : item);
      }
      return [...prev, result.item];
    });
    const itemHistory = await fetchData('bank-item-history');
    setBankItemHistory(itemHistory);
    return result.item;
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

  const clearBankUpload = () => {
    setBankUploadParsed(null);
    setBankUploadMeta({ gold: null });
    setBankUploadStatus('');
  };

  const clearBankUpdate = () => {
    setBankUpdateJsonText('');
    clearBankUpload();
  };

  const archiveBankRequests = (requestIds = []) => {
    const normalized = [...new Set([...bankArchivedRequestIds, ...requestIds.filter(Boolean)])];
    setBankArchivedRequestIds(normalized);
  };

  const restoreArchivedBankRequests = (requestIds = []) => {
    const normalized = new Set(requestIds.filter(Boolean));
    setBankArchivedRequestIds(prev => prev.filter(id => !normalized.has(id)));
  };

  const deleteArchivedBankRequests = async (requestIds = []) => {
    const normalizedIds = (Array.isArray(requestIds) ? requestIds : []).filter(Boolean);
    if (normalizedIds.length === 0) return;

    const uniqueIds = [...new Set(normalizedIds.map(id => String(id)))];
    for (const requestId of uniqueIds) {
      await deleteData(`bank-requests/${requestId}`);
    }

    const refreshed = await fetchData('bank-requests');
    setBankRequests(refreshed);
    setBankArchivedRequestIds(prev => prev.filter(id => !uniqueIds.some(uniqueId => String(uniqueId) === String(id))));
  };

  const visibleBankRequests = useMemo(() => {
    return (Array.isArray(bankRequests) ? bankRequests : []).filter(request => !bankArchivedRequestIds.includes(request.id));
  }, [bankRequests, bankArchivedRequestIds]);

  const archivedBankRequests = useMemo(() => {
    return (Array.isArray(bankRequests) ? bankRequests : []).filter(request => bankArchivedRequestIds.includes(request.id));
  }, [bankRequests, bankArchivedRequestIds]);

  const archivedRequestIds = useMemo(() => archivedBankRequests.map(request => request.id), [archivedBankRequests]);

  const handleResolveBankRequest = async (id, status, price, note, approvedQuantity) => {
    try {
      await putData(`bank-requests/${id}`, { status, price, officer_note: note, approved_quantity: approvedQuantity });
      const requests = await fetchData('bank-requests');
      setBankRequests(requests);
    } catch {
      throw new Error('Failed to resolve bank request.');
    }
  };

  const handleBulkResolveBankRequests = async (resolutions, summaryMessage) => {
    try {
      await putData('bank-requests/bulk-resolve', { resolutions });
      const requests = await fetchData('bank-requests');
      setBankRequests(requests);
      return { success: true, summaryMessage };
    } catch {
      throw new Error('Failed to resolve bulk bank requests.');
    }
  };

  return {
    bankItems,
    bankItemHistory,
    bankRequests,
    bankSearch,
    setBankSearch,
    bankArchivedRequestIds,
    bankUpdateJsonText,
    setBankUpdateJsonText,
    notifyBankUpdate,
    setNotifyBankUpdate,
    bankUploadParsed,
    bankUploadStatus,
    bankUploadMeta,
    handleParseBankUpdateJson,
    handleSaveBankUpload,
    handleRestoreBankItem,
    clearBankUpload,
    clearBankUpdate,
    handleResolveBankRequest,
    handleBulkResolveBankRequests,
    archiveBankRequests,
    restoreArchivedBankRequests,
    deleteArchivedBankRequests,
    visibleBankRequests,
    archivedBankRequests,
    archivedRequestIds,
    bankContentsHistory,
    exportBankContentsHistoryCsv
  };
}
