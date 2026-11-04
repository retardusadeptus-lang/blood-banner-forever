export default function SiteInstructionsAdminTab() {
  return (
    <div className="theme-surface rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-bold text-slate-100">Site Instructions</h3>
      <p className="text-sm text-slate-400">A quick guide for how to run the dashboard workflows during raid week.</p>
      <div className="theme-surface-raised rounded-lg p-4 text-sm text-slate-300 space-y-2 break-words">
        <p>Start in bank contents for inventory visibility, then move to Requests or Update when officers need to process materials.</p>
        <p>Use Raid Signups for event setup and attendance planning, then confirm groups before raid night.</p>
        <p>Finalize assignments and priority changes before posting updates to your team.</p>
      </div>
    </div>
  );
}
