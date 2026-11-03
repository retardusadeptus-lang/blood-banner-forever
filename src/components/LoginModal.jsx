import React, { useState } from 'react';

export default function LoginModal({
  open,
  onClose,
  bnetAuthenticated,
  battletag,
  onBattleNetLogin,
  onBattleNetLogout,
  adminAuthenticated,
  onAdminLogin,
  onAdminLogout,
}) {
  const [password, setPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  if (!open) return null;

  const submitAdminLogin = async (event) => {
    event.preventDefault();
    setAdminError('');
    const authenticated = await onAdminLogin(event, password);
    if (authenticated) {
      setPassword('');
      onClose();
    } else {
      setAdminError('Incorrect password or login request failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 id="login-modal-title" className="text-lg font-bold text-slate-100">Login</h2>
            <p className="text-xs text-slate-400 mt-1">Choose a login method for officer access.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200">
            Close
          </button>
        </div>

        <div className="space-y-4">
          <section className="border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Battle.net</h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {bnetAuthenticated ? `Logged in as ${battletag || 'Battle.net user'}` : 'Use your Battle.net account.'}
                </p>
              </div>
              {bnetAuthenticated ? (
                <button type="button" onClick={onBattleNetLogout} className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200">
                  Logout
                </button>
              ) : (
                <button type="button" onClick={onBattleNetLogin} className="bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 px-3 rounded text-[11px] uppercase tracking-wider">
                  Login
                </button>
              )}
            </div>
          </section>

          <section className="border border-slate-700 rounded-lg p-4">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-slate-100">Admin password</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {adminAuthenticated ? 'Admin password session is active.' : 'Use the local or configured admin password.'}
              </p>
            </div>
            {adminAuthenticated ? (
              <button type="button" onClick={onAdminLogout} className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200">
                Logout
              </button>
            ) : (
              <form onSubmit={submitAdminLogin} className="flex gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-w-0 flex-1 bg-slate-950 text-white border border-slate-700 rounded px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Admin password"
                  autoFocus
                />
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-3 rounded text-[11px] uppercase tracking-wider">
                  Login
                </button>
              </form>
            )}
            {adminError && <p className="mt-2 text-xs text-red-300">{adminError}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
