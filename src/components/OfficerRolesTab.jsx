import React, { useMemo, useState } from 'react';

export default function OfficerRolesTab({
  roster,
  getSpecById,
  officerRoles,
  setOfficerRoles,
  myPlayerId,
  hasUnsavedChanges,
  onSaveChanges,
  isSaving
}) {
  const [newRoleName, setNewRoleName] = useState('');
  const [showMineOnly, setShowMineOnly] = useState(false);

  const addRole = () => {
    const roleName = newRoleName.trim();
    if (!roleName) return;
    if (officerRoles.some(r => String(r.role_name).toLowerCase() === roleName.toLowerCase())) {
      alert('That role already exists.');
      return;
    }

    setOfficerRoles(prev => ([
      ...prev,
      {
        id: Date.now(),
        role_name: roleName,
        primary_officer_id: null,
        backup_officer_ids: []
      }
    ]));
    setNewRoleName('');
  };

  const removeRole = (roleId) => {
    if (!window.confirm('Remove this officer role?')) return;
    setOfficerRoles(prev => prev.filter(r => r.id !== roleId));
  };

  const updateRole = (roleId, patch) => {
    setOfficerRoles(prev => prev.map(role => {
      if (role.id !== roleId) return role;
      return { ...role, ...patch };
    }));
  };

  const setBackupAtIndex = (roleId, backupIndex, selectedId) => {
    setOfficerRoles(prev => prev.map(role => {
      if (role.id !== roleId) return role;
      const backups = Array.isArray(role.backup_officer_ids) ? role.backup_officer_ids : [];
      const normalized = [backups[0] || null, backups[1] || null];
      const next = [...normalized];
      next[backupIndex] = selectedId || null;

      if (role.primary_officer_id && next[backupIndex] === role.primary_officer_id) {
        next[backupIndex] = null;
      }

      if (next[0] && next[1] && next[0] === next[1]) {
        next[backupIndex] = null;
      }

      return { ...role, backup_officer_ids: next.filter(Boolean) };
    }));
  };

  const updatePrimaryOfficer = (roleId, primaryId) => {
    setOfficerRoles(prev => prev.map(role => {
      if (role.id !== roleId) return role;
      const backups = Array.isArray(role.backup_officer_ids) ? role.backup_officer_ids : [];
      const filteredBackups = backups.filter(id => id !== primaryId);
      return { ...role, primary_officer_id: primaryId, backup_officer_ids: filteredBackups.slice(0, 2) };
    }));
  };

  const minePlayerId = myPlayerId ? Number(myPlayerId) : null;
  const minePlayer = minePlayerId ? roster.find(p => p.id === minePlayerId) : null;

  const visibleRoles = useMemo(() => {
    if (!showMineOnly || !minePlayerId) return officerRoles;
    return officerRoles.filter(role => {
      const backups = Array.isArray(role.backup_officer_ids) ? role.backup_officer_ids : [];
      return role.primary_officer_id === minePlayerId || backups.includes(minePlayerId);
    });
  }, [officerRoles, showMineOnly, minePlayerId]);

  const getBackupValue = (role, index) => {
    const backups = Array.isArray(role.backup_officer_ids) ? role.backup_officer_ids : [];
    return backups[index] || '';
  };

  return (
    <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Officer Roles</h2>
          <p className="text-sm text-slate-500">Create roles, save, then manage assignments in a 4-column editable list.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMineOnly(prev => !prev)}
            disabled={!minePlayerId}
            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${showMineOnly ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'} ${!minePlayerId ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={minePlayerId ? `Show only roles for ${minePlayer?.name || 'selected player'}` : 'Select your character first to use Show Mine'}
          >
            {showMineOnly ? 'Showing Mine' : 'Show Mine'}
          </button>
          <button
            type="button"
            onClick={onSaveChanges}
            disabled={!hasUnsavedChanges || isSaving}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          >
            {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Roles' : 'No Changes'}
          </button>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newRoleName}
            onChange={e => setNewRoleName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addRole();
              }
            }}
            placeholder="Add role (e.g. Recruitment, Raid Leader, Guild Bank)"
            className="flex-1 bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={addRole}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded text-xs uppercase tracking-wider"
          >
            Add Role
          </button>
        </div>
      </div>

      {officerRoles.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
          No officer roles yet.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="hidden xl:grid xl:grid-cols-4 gap-3 px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-800">
            <span>Role</span>
            <span>Primary Officer</span>
            <span>Backup 1</span>
            <span>Backup 2</span>
          </div>

          {visibleRoles.length === 0 ? (
            <div className="text-center py-8 border border-slate-800 rounded-xl text-slate-500 bg-slate-950">
              No roles matched your "Show Mine" filter.
            </div>
          ) : visibleRoles.map(role => {
            const backups = Array.isArray(role.backup_officer_ids) ? role.backup_officer_ids : [];
            const backup1 = getBackupValue(role, 0);
            const backup2 = getBackupValue(role, 1);

            return (
              <div key={role.id} className="grid grid-cols-1 xl:grid-cols-4 gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950">
                <div>
                  <label className="xl:hidden block text-[10px] text-slate-500 uppercase font-bold mb-1">Role</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={role.role_name}
                      onChange={e => updateRole(role.id, { role_name: e.target.value })}
                      className="w-full bg-slate-900 text-amber-300 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                    />
                    <button
                      onClick={() => removeRole(role.id)}
                      className="text-red-400 hover:text-red-300 font-bold text-sm px-2"
                      title="Remove role"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div>
                  <label className="xl:hidden block text-[10px] text-slate-500 uppercase font-bold mb-1">Primary Officer</label>
                  <select
                    value={role.primary_officer_id || ''}
                    onChange={e => updatePrimaryOfficer(role.id, e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="">-- Select Primary --</option>
                    {roster.map(player => {
                      const spec = getSpecById(player.spec_id);
                      return <option key={player.id} value={player.id} style={{ color: spec?.color }}>{player.name}</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label className="xl:hidden block text-[10px] text-slate-500 uppercase font-bold mb-1">Backup 1</label>
                  <select
                    value={backup1}
                    onChange={e => setBackupAtIndex(role.id, 0, e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="">-- Select Backup --</option>
                    {roster
                      .filter(player => player.id !== role.primary_officer_id && player.id !== Number(backup2 || 0))
                      .map(player => {
                        const spec = getSpecById(player.spec_id);
                        return <option key={player.id} value={player.id} style={{ color: spec?.color }}>{player.name}</option>;
                      })}
                  </select>
                </div>

                <div>
                  <label className="xl:hidden block text-[10px] text-slate-500 uppercase font-bold mb-1">Backup 2</label>
                  <select
                    value={backup2}
                    onChange={e => setBackupAtIndex(role.id, 1, e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="">-- Select Backup --</option>
                    {roster
                      .filter(player => player.id !== role.primary_officer_id && player.id !== Number(backup1 || 0))
                      .map(player => {
                        const spec = getSpecById(player.spec_id);
                        return <option key={player.id} value={player.id} style={{ color: spec?.color }}>{player.name}</option>;
                      })}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
