export default function RecruitmentAboutTab() {
  return (
    <section className="space-y-6 rounded-b-xl rounded-tr-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Recruitment</p>
        <h2 className="text-2xl font-bold text-slate-100">About Us</h2>
        <p className="text-sm leading-6 text-slate-300">
          Blood and Banner is a guild for players who enjoy organized raids, clear communication, and a relaxed community outside the raid.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h3 className="text-sm font-bold text-slate-100">Our guild</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            We build teams that value preparation, consistency, and making room for people to improve.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h3 className="text-sm font-bold text-slate-100">Our raids</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            We use shared plans, assignments, and honest feedback to make raid time focused and enjoyable.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h3 className="text-sm font-bold text-slate-100">Our community</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Good attitude matters here. We welcome dependable players who want to contribute and play as a team.
          </p>
        </div>
      </div>
    </section>
  );
}
