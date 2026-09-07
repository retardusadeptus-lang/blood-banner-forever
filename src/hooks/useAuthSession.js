import { useCallback, useEffect, useState } from 'react';
import { login, getBattleNetAuthMe, getBattleNetCharacters, startBattleNetLogin, logoutBattleNet, claimRosterCharacter, claimRosterCharacterManual, getRosterClaimsAdmin, unclaimRosterCharacterAdmin } from '../services/apiService';

export default function useAuthSession({ fetchData, setRoster, setRosterDirty }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('ar-auth') === 'true');
  const [bnetAuthState, setBnetAuthState] = useState({ loading: true, authenticated: false, user: null, claimedCharacters: [], roles: [], isOfficer: false, isAdmin: false, error: '', characters: [], diagnostics: [], showBnetCharacterLookup: false });
  const [bnetClaimBusy, setBnetClaimBusy] = useState(false);
  const [showBnetClaimModal, setShowBnetClaimModal] = useState(false);
  const [rosterClaims, setRosterClaims] = useState([]);

  const handleLogin = async (password) => {
    try {
      const token = await login(password);
      if (token) {
        setIsAuthenticated(true);
        sessionStorage.setItem('ar-auth-token', token);
        sessionStorage.setItem('ar-auth', 'true');
        return true;
      }
    } catch (error) {
      console.error('Officer login failed:', error);
    }

    setIsAuthenticated(false);
    sessionStorage.removeItem('ar-auth');
    sessionStorage.removeItem('ar-auth-token');
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('ar-auth');
    sessionStorage.removeItem('ar-auth-token');
  };

  const refreshBattleNetAuth = async () => {
    setBnetAuthState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const me = await getBattleNetAuthMe();
      const authenticated = Boolean(me?.authenticated);
      let characters = [];
      let characterError = '';
      if (authenticated) {
        try {
          const profile = await getBattleNetCharacters();
          characters = Array.isArray(profile?.characters) ? profile.characters : [];
        } catch (err) {
          characterError = err.message || 'Failed to load Battle.net characters.';
        }
      }
      setBnetAuthState({
        loading: false,
        authenticated,
        user: me?.user || null,
        claimedCharacters: me?.claimedCharacters || [],
        roles: Array.isArray(me?.roles) ? me.roles : [],
        isOfficer: Boolean(me?.isOfficer),
        isAdmin: Boolean(me?.isAdmin),
        error: characterError,
        characters,
        diagnostics: [],
        showBnetCharacterLookup: authenticated
      });
    } catch (err) {
      setBnetAuthState({
        loading: false,
        authenticated: false,
        user: null,
        claimedCharacters: [],
        roles: [],
        isOfficer: false,
        isAdmin: false,
        error: err.message || 'Battle.net session unavailable.',
        characters: [],
        diagnostics: [],
        showBnetCharacterLookup: false
      });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authState = params.get('auth');
    if (authState === 'success' || authState === 'failed') {
      const nextUrl = `${window.location.pathname}${window.location.hash}`;
      window.history.replaceState({}, '', nextUrl);
    }
    refreshBattleNetAuth();
  }, []);

  const handleBattleNetLogin = () => {
    startBattleNetLogin();
  };

  const handleBattleNetLogout = async () => {
    try {
      await logoutBattleNet();
    } catch (err) {
      console.error('Failed to log out from Battle.net:', err);
    } finally {
      await refreshBattleNetAuth();
    }
  };

  const refreshRosterClaims = useCallback(async () => {
    const hasOfficerAccess = isAuthenticated || bnetAuthState.isOfficer || bnetAuthState.isAdmin;
    if (!hasOfficerAccess) {
      setRosterClaims([]);
      return;
    }
    try {
      const data = await getRosterClaimsAdmin();
      setRosterClaims(data.claims || []);
    } catch {
      setRosterClaims([]);
    }
  }, [isAuthenticated, bnetAuthState.isOfficer, bnetAuthState.isAdmin]);

  const handleBattleNetClaim = async (character) => {
    setBnetClaimBusy(true);
    setBnetAuthState(prev => ({ ...prev, error: '' }));
    try {
      await claimRosterCharacter({ characterName: character.name, realmSlug: character.realmSlug });
      const rosterData = await fetchData('roster');
      setRoster(rosterData);
      setRosterDirty(false);
      await refreshBattleNetAuth();
      await refreshRosterClaims();
      setShowBnetClaimModal(false);
    } catch (err) {
      setBnetAuthState(prev => ({ ...prev, error: err.message || 'Failed to claim roster character.' }));
    } finally {
      setBnetClaimBusy(false);
    }
  };

  const handleUnclaimClaim = async (claim) => {
    try {
      await unclaimRosterCharacterAdmin({ rosterId: claim.rosterId });
      const rosterData = await fetchData('roster');
      setRoster(rosterData);
      setRosterDirty(false);
      await refreshBattleNetAuth();
      await refreshRosterClaims();
    } catch (err) {
      setBnetAuthState(prev => ({ ...prev, error: err.message || 'Failed to clear the claim.' }));
    }
  };

  const handleBattleNetManualClaim = async (player) => {
    setBnetClaimBusy(true);
    setBnetAuthState(prev => ({ ...prev, error: '' }));
    try {
      await claimRosterCharacterManual({ rosterId: player.id, battletag: bnetAuthState.user?.battletag || '' });
      const rosterData = await fetchData('roster');
      setRoster(rosterData);
      setRosterDirty(false);
      await refreshBattleNetAuth();
      await refreshRosterClaims();
      setShowBnetClaimModal(false);
    } catch (err) {
      setBnetAuthState(prev => ({ ...prev, error: err.message || 'Failed to claim roster character.' }));
    } finally {
      setBnetClaimBusy(false);
    }
  };

  return {
    isAuthenticated,
    setIsAuthenticated,
    handleLogin,
    handleLogout,
    bnetAuthState,
    bnetClaimBusy,
    showBnetClaimModal,
    setShowBnetClaimModal,
    handleBattleNetLogin,
    handleBattleNetLogout,
    handleBattleNetClaim,
    handleBattleNetManualClaim,
    refreshBattleNetAuth,
    rosterClaims,
    refreshRosterClaims,
    handleUnclaimClaim
  };
}
