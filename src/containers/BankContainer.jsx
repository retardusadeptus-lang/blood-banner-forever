import { useState } from 'react';
import GuildBankTab from '../components/GuildBankTab';
import BankUpdate from '../components/BankUpdate';
import BankRequestHistory from '../components/BankRequestHistory';
import BankContentsHistory from '../components/BankContentsHistory';
import BankRequestsTab from '../components/BankRequestsTab';
import useBankData from '../hooks/useBankData';
import { downloadCsv } from '../utils/csv';

export default function BankContainer({
  fetchData,
  putData,
  isAuthenticated,
  roster,
  specsByName,
  getDisplayFromId,
  bankSubTab,
  activeTab,
  globalMyPlayerId
}) {
  const {
    bankItems,
    bankSearch,
    setBankSearch,
    bankUpdateJsonText,
    setBankUpdateJsonText,
    bankUploadParsed,
    bankUploadStatus,
    bankUploadMeta,
    handleUploadBankLuaFile,
    handleParseBankUpdateJson,
    handleSaveBankUpload,
    clearBankUpload,
    clearBankUpdate,
    handleResolveBankRequest,
    handleBulkResolveBankRequests,
    archiveBankRequests,
    restoreArchivedBankRequests,
    visibleBankRequests,
    archivedBankRequests,
    archivedRequestIds,
    bankContentsHistory,
    exportBankContentsHistoryCsv
  } = useBankData({ fetchData, putData, isAuthenticated });

  const myPlayerId = globalMyPlayerId ? parseInt(globalMyPlayerId, 10) : null;

  const handleBankFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUploadBankLuaFile(file);
  };

  const exportArchivedRequestsCsv = () => {
    const headers = ['id', 'created_at', 'status', 'item_name', 'quantity', 'approved_quantity', 'price', 'requester_name', 'reason', 'officer_note'];
    const rows = archivedBankRequests.map(request => {
      const rosterPlayer = roster.find(player => Number(player.id) === Number(request.player_id));
      return [
        request.id,
        request.created_at,
        request.status,
        request.item_name,
        request.quantity,
        request.approved_quantity,
        request.price,
        rosterPlayer?.name || request.player_name || request.requester_name || '',
        request.reason,
        request.officer_note
      ];
    });
    downloadCsv(`bank-request-history-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`, headers, rows);
  };

  const bankRequestsProps = {
    bankRequests: visibleBankRequests,
    roster,
    specsByName,
    getDisplayFromId,
    handleResolveBankRequest,
    handleBulkResolveBankRequests,
    archivedBankRequests,
    onArchiveBankRequests: archiveBankRequests,
    onRestoreArchivedBankRequests: restoreArchivedBankRequests
  };

  if (activeTab === 'bankRequests') {
    if (!isAuthenticated) {
      return (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          <h3 className="text-lg font-bold text-slate-200 mb-2">Officer login required</h3>
          <p className="text-sm">Use the officer unlock bar above to manage bank requests and inventory updates.</p>
        </div>
      );
    }

    return <BankRequestsTab {...bankRequestsProps} />;
  }

  if (activeTab !== 'bank') return null;

  return (
    <div className="space-y-4">
      {bankSubTab === 'contents' && (
        <GuildBankTab
          bankItems={bankItems}
          bankSearch={bankSearch}
          setBankSearch={setBankSearch}
          isAuthenticated={isAuthenticated}
          roster={roster}
          myPlayerId={myPlayerId}
        />
      )}
      {bankSubTab === 'requests' && (
        isAuthenticated ? (
          <BankRequestsTab {...bankRequestsProps} />
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <h3 className="text-lg font-bold text-slate-200 mb-2">Officer login required</h3>
            <p className="text-sm">Use the officer unlock bar above to manage bank requests and inventory updates.</p>
          </div>
        )
      )}
      {bankSubTab === 'addon' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-amber-400">Guild Bank Addon</h3>
          <p className="text-sm text-slate-400">Install the TBC Bank Logger addon to stream live bank snapshots into the dashboard.</p>
          <a href="/addon/TBCBankLogger.zip" className="inline-flex items-center rounded-lg border border-amber-600/40 bg-amber-600/10 px-4 py-2 text-sm font-bold text-amber-400 transition hover:bg-amber-600/20">Download Addon (.zip)</a>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300 space-y-2">
            <p>1. Extract the addon into your WoW Interface folder.</p>
            <p>2. Reload the UI and log in with your guild character.</p>
            <p>3. Use the Update sub-tab to sync new bank snapshots when the vault changes.</p>
          </div>
        </div>
      )}
      {bankSubTab === 'update' && (
        isAuthenticated ? (
          <BankUpdate
            handleBankFileUpload={handleBankFileUpload}
            bankUpdateJsonText={bankUpdateJsonText}
            setBankUpdateJsonText={setBankUpdateJsonText}
            handleParseBankUpdateJson={handleParseBankUpdateJson}
            clearBankUpdate={clearBankUpdate}
            handleSaveBankUpload={handleSaveBankUpload}
            bankUploadStatus={bankUploadStatus}
            bankUploadMeta={bankUploadMeta}
            bankUploadParsed={bankUploadParsed}
          />
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <h3 className="text-lg font-bold text-slate-200 mb-2">Officer login required</h3>
            <p className="text-sm">This section is reserved for officer inventory updates.</p>
          </div>
        )
      )}
      {bankSubTab === 'history' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
          <BankRequestHistory
            archivedBankRequests={archivedBankRequests}
            archivedRequestIds={archivedRequestIds}
            exportArchivedRequestsCsv={exportArchivedRequestsCsv}
            onRestoreArchivedBankRequests={restoreArchivedBankRequests}
          />

          <div className="space-y-2">
            <BankContentsHistory bankContentsHistory={bankContentsHistory} exportBankContentsHistoryCsv={exportBankContentsHistoryCsv} />
          </div>
        </div>
      )}
    </div>
  );
}
