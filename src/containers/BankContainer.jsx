import GuildBankTab from '../components/GuildBankTab';
import BankUpdate from '../components/BankUpdate';
import BankRequestHistory from '../components/BankRequestHistory';
import BankContentsHistory from '../components/BankContentsHistory';
import BankItemHistory from '../components/BankItemHistory';
import BankRequestsTab from '../components/BankRequestsTab';
import useBankData from '../hooks/useBankData';
import { downloadCsv } from '../utils/csv';

export default function BankContainer({
  api,
  session,
  directory,
  navigation,
  siteTabMetadata
}) {
  const { fetchData, putData, deleteData } = api;
  const { isAuthenticated, bnetAuthState } = session;
  const { roster, specsByName, getDisplayFromId } = directory;
  const { bankSubTab, activeTab, globalMyPlayerId } = navigation;
  const {
    bankItems,
    bankItemHistory,
    bankSearch,
    setBankSearch,
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
  } = useBankData({ fetchData, putData, deleteData, isAuthenticated });

  const myPlayerId = globalMyPlayerId ? parseInt(globalMyPlayerId, 10) : null;
  const registryRoute = siteTabMetadata?.contentOwner === 'BankContainer' ? siteTabMetadata.route : null;
  const resolvedActiveTab = registryRoute?.activeTab || activeTab;
  const resolvedBankSubTab = siteTabMetadata?.id === 'guild-bank.requests'
    ? 'requests'
    : registryRoute?.subTab || bankSubTab;

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

  if (resolvedActiveTab === 'bankRequests') {
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

  if (resolvedActiveTab !== 'bank') return null;

  return (
    <div className="space-y-4">
      {resolvedBankSubTab === 'contents' && (
        <GuildBankTab
          bankItems={bankItems}
          bankItemHistory={bankItemHistory}
          bankSearch={bankSearch}
          setBankSearch={setBankSearch}
          isAuthenticated={isAuthenticated}
          bnetAuthState={bnetAuthState}
          roster={roster}
          myPlayerId={myPlayerId}
        />
      )}
      {resolvedBankSubTab === 'requests' && (
        isAuthenticated ? (
          <BankRequestsTab {...bankRequestsProps} />
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <h3 className="text-lg font-bold text-slate-200 mb-2">Officer login required</h3>
            <p className="text-sm">Use the officer unlock bar above to manage bank requests and inventory updates.</p>
          </div>
        )
      )}
      {resolvedBankSubTab === 'addon' && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-amber-400">Guild Bank Addon</h3>
            <p className="text-sm text-slate-400">Install the TBC Bank Logger addon to export live bank snapshots into the dashboard.</p>
            <a href="/addon/TBCBankLogger.zip" className="inline-flex items-center rounded-lg border border-amber-600/40 bg-amber-600/10 px-4 py-2 text-sm font-bold text-amber-400 transition hover:bg-amber-600/20">Download Addon (.zip)</a>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300 space-y-2">
                <h4 className="font-bold text-slate-100">Install and export</h4>
                <p>1. Extract the zip so the addon folder is directly inside your WoW <code className="text-amber-300">Interface/AddOns</code> folder.</p>
                <p>2. Reload the UI with <code className="text-amber-300">/reload</code>, then open the guild bank with a character who can view its tabs.</p>
                <p>3. The addon scans automatically when the bank opens. Use <code className="text-amber-300">/gbscan</code> to scan again.</p>
                <p>4. Use <code className="text-amber-300">/gbexport</code>, copy all of the JSON, and paste it into the Bank Update box below.</p>
                <p>5. Preview the changes, then save the update when the inventory looks correct.</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300 space-y-2">
                <h4 className="font-bold text-slate-100">Commands</h4>
                <p><code className="text-amber-300">/gbscan</code> - scan all guild bank tabs you can view.</p>
                <p><code className="text-amber-300">/gbexport</code> - open the latest scan as JSON for copying.</p>
                <p><code className="text-amber-300">/gbimport</code> - open the current guild bank shopping list in-game.</p>
                <p>Run <code className="text-amber-300">/gbexport</code> again after making bank changes so the dashboard stays current.</p>
              </div>
            </div>
          </div>
          {isAuthenticated ? (
            <BankUpdate
              bankUpdateJsonText={bankUpdateJsonText}
              setBankUpdateJsonText={setBankUpdateJsonText}
              notifyBankUpdate={notifyBankUpdate}
              setNotifyBankUpdate={setNotifyBankUpdate}
              handleParseBankUpdateJson={handleParseBankUpdateJson}
              clearBankUpdate={clearBankUpdate}
              handleSaveBankUpload={handleSaveBankUpload}
              bankUploadStatus={bankUploadStatus}
              bankUploadMeta={bankUploadMeta}
              bankUploadParsed={bankUploadParsed}
            />
          ) : null}
        </div>
      )}
      {resolvedBankSubTab === 'history' && (
        <div className="space-y-4">
          <BankRequestHistory
            archivedBankRequests={archivedBankRequests}
            archivedRequestIds={archivedRequestIds}
            exportArchivedRequestsCsv={exportArchivedRequestsCsv}
            onRestoreArchivedBankRequests={restoreArchivedBankRequests}
            onDeleteArchivedBankRequests={deleteArchivedBankRequests}
          />

          <BankContentsHistory bankContentsHistory={bankContentsHistory} exportBankContentsHistoryCsv={exportBankContentsHistoryCsv} />
          {isAuthenticated && (
            <BankItemHistory bankItemHistory={bankItemHistory} onRestoreBankItem={handleRestoreBankItem} />
          )}
        </div>
      )}
    </div>
  );
}
