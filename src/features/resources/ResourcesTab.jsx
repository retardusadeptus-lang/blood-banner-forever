import BisConfigTab from '../../components/BisConfigTab';
import WeakaurasTab from './WeakaurasTab';

export default function ResourcesTab({
  resourcesSubTab,
  selectedBisSpec,
  setSelectedBisSpec,
  masterItemsDbPhase,
  setMasterItemsDbPhase,
  specsFromDb,
  renderItemSlot,
  specsByName,
  fetchData,
  postData,
  canSubmitWeakauras
}) {
  return (
    <div className="space-y-4">
      {resourcesSubTab === 'bis' && (
        <BisConfigTab
          selectedBisSpec={selectedBisSpec}
          setSelectedBisSpec={setSelectedBisSpec}
          masterItemsDbPhase={masterItemsDbPhase}
          setMasterItemsDbPhase={setMasterItemsDbPhase}
          specsFromDb={specsFromDb}
          renderItemSlot={renderItemSlot}
          specsByName={specsByName}
        />
      )}

      {resourcesSubTab === 'tactics' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-100">Raid Tactics</h3>
          <p className="text-sm text-slate-400">Quick reminders for the upcoming raid plan, boss mechanics, and role-specific priorities.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><div className="text-sm font-semibold text-amber-400">Tank/healer calls</div><div className="mt-2 text-sm text-slate-400">Use the raid assignment view to confirm who is covering each role and where to position them.</div></div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><div className="text-sm font-semibold text-amber-400">Encounter prep</div><div className="mt-2 text-sm text-slate-400">Review the latest signup events and group config before the pull so everyone knows their lane.</div></div>
          </div>
        </div>
      )}

      {resourcesSubTab === 'weakauras' && (
        <WeakaurasTab
          fetchData={fetchData}
          postData={postData}
          canSubmit={canSubmitWeakauras}
        />
      )}

      {resourcesSubTab === 'cheatsheets' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-100">Cheat Sheets</h3>
          <p className="text-sm text-slate-400">These quick-reference cards are kept alongside the BiS planner for fast raid prep.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><div className="text-sm font-semibold text-amber-400">Raid prep</div><div className="mt-2 text-sm text-slate-400">Check open signup events, verify roster attendance, and use the active phase planner before each raid.</div></div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><div className="text-sm font-semibold text-amber-400">Bank workflow</div><div className="mt-2 text-sm text-slate-400">Use the main bank tab for browsing the vault, then switch to Requests or Update to manage officer workflows.</div></div>
          </div>
        </div>
      )}

      {resourcesSubTab === 'raidlogs' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-100">Raid Logs</h3>
          <p className="text-sm text-slate-400">Links and notes for the most recent raid logs, parses, and attendance reviews.</p>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Use the roster and scoring pages to review attendance and compare recent raid performance.</div>
        </div>
      )}

      {resourcesSubTab === 'wowaudit' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-100">WoWAudit</h3>
          <p className="text-sm text-slate-400">Keep a short list of important WoWAudit links, profiles, or notes for known raid goals and progress.</p>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Add the relevant audit links here whenever you want them close at hand during planning.</div>
        </div>
      )}

      {resourcesSubTab === 'wipefest' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-100">Wipefest</h3>
          <p className="text-sm text-slate-400">Store the latest wipefest links or notes for encounter discussion and post-raid review.</p>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Link the relevant threads or summaries so they are available during the next planning session.</div>
        </div>
      )}
    </div>
  );
}
