import React from 'react';

function normalizeList(rawText) {
  return Array.from(
    new Set(
      String(rawText || '')
        .split(/[\n,]/)
        .map(v => v.trim())
        .filter(Boolean)
        .map(v => v.toLowerCase())
    )
  );
}

function toEditorText(values) {
  if (!Array.isArray(values) || values.length === 0) return '';
  return values.join('\n');
}

export default function DiscordBotConfigTab({
  config,
  setConfig,
  hasUnsavedChanges,
  onSaveChanges,
  isSaving
}) {
  const updateRoleList = (field, rawText) => {
    setConfig(prev => ({
      ...(prev || {}),
      [field]: normalizeList(rawText)
    }));
  };

  const requestText = toEditorText(config?.request_roles);
  const signupText = toEditorText(config?.signup_roles);
  const benchText = toEditorText(config?.bench_roles);

  return (
    <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Discord Bot Config</h2>
          <p className="text-sm text-slate-500">Set which Discord roles can run each slash command. Enter role IDs or exact role names, one per line.</p>
        </div>
        <button
          type="button"
          onClick={onSaveChanges}
          disabled={!hasUnsavedChanges || isSaving}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
        >
          {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Config' : 'No Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Request Command Roles</label>
          <textarea
            value={requestText}
            onChange={e => updateRoleList('request_roles', e.target.value)}
            className="w-full h-48 bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
            placeholder="Example:\nraider\n123456789012345678"
          />
          <p className="text-[11px] text-slate-500 mt-2">Controls access to /request. Empty list means unrestricted.</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Raid Signup Roles</label>
          <textarea
            value={signupText}
            onChange={e => updateRoleList('signup_roles', e.target.value)}
            className="w-full h-48 bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
            placeholder="Example:\nraider\ncore raider"
          />
          <p className="text-[11px] text-slate-500 mt-2">Controls access to /raid signup. Empty list means unrestricted.</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Raid Bench Roles</label>
          <textarea
            value={benchText}
            onChange={e => updateRoleList('bench_roles', e.target.value)}
            className="w-full h-48 bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
            placeholder="Example:\nofficer\nraid leader"
          />
          <p className="text-[11px] text-slate-500 mt-2">Controls access to /raid bench. Empty list means unrestricted.</p>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">How To Use The Bot</h3>
        <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1">
          <li>Set DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, and DISCORD_GUILD_ID in guild-loot-api/.env.</li>
          <li>Start API + bot together using npm start from guild-loot-api.</li>
          <li>Open this tab and save role access for request, signup, and bench commands.</li>
          <li>Use /request with item autocomplete and character autocomplete.</li>
          <li>Use /raid signup or /raid bench to toggle in_raid in roster.</li>
        </ol>
      </div>
    </section>
  );
}
