import { useEffect, useState } from 'react';
import { login, getBattleNetAuthMe, startBattleNetLogin, logoutBattleNet, claimRosterCharacter, claimRosterCharacterManual, getRosterClaimsAdmin, unclaimRosterCharacterAdmin } from '../services/apiService';

export default function useAuthSession({ fetchData, setRoster, setRosterDirty }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('ar-auth') === 'true');
  const [bnetAuthState, setBnetAuthState] = useState({ loading: true, authenticated: false, user: null, claimedCharacters: [], error: '', characters: [], diagnostics: [], showBnetCharacterLookup: false });
  const [bnetClaimBusy, setBnetClaimBusy] = useState(false);
  const [showBnetClaimModal, setShowBnetClaimModal] = useState(false);
  const [rosterClaims, setRosterClaims] = useState([]);

  const handleLogin = async (password) => {
    const token = await login(password);
    if (token) {
      setIsAuthenticated(true);
      sessionStorage.setItem('ar-auth-token', token);
      sessionStorage.setItem('ar-auth', 'true');
      return true;
    }
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
      setBnetAuthState({
        loading: false,
        authenticated,
        user: me?.user || null,
        claimedCharacters: me?.claimedCharacters || [],
        error: '',
        characters: [],
        diagnostics: [],
        showBnetCharacterLookup: authenticated
      });
    } catch (error) {
      setBnetAuthState({
        loading: false,
        authenticated: false,
        user: null,
        claimedCharacters: [],
        error: error.message || 'Battle.net session unavailable.',
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
    } catch (error) {
      console.error('Failed to log out from Battle.net:', error);
    } finally {
      await refreshBattleNetAuth();
    }
  };

  const handleBattleNetClaim = async (character) => {
    setBnetClaimBusy(true);
    setBnetAuthState(prev => ({ ...prev, error: '' }));
    try {
      await claimRosterCharacter({ characterName: character.name, realmSlug: character.realmSlug });
      const rosterData = await fetchData('roster');
      setRoster(rosterData);
      setRosterDirty(false);
      await refreshBattleNetAuth();
      setShowBnetClaimModal(false);
    } catch (error) {
      setBnetAuthState(prev => ({ ...prev, error: error.message || 'Failed to claim roster character.' }));
    } finally {
      setBnetClaimBusy(false);
    }
  };

  const refreshRosterClaims = async () => {
    if (!isAuthenticated) {
      setRosterClaims([]);
      return;
    }
    try {
      const data = await getRosterClaimsAdmin();
      setRosterClaims(data.claims || []);
    } catch (error) {
      setRosterClaims([]);
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
    } catch (error) {
      setBnetAuthState(prev => ({ ...prev, error: error.message || 'Failed to clear the claim.' }));
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
      setShowBnetClaimModal(false);
    } catch (error) {
      setBnetAuthState(prev => ({ ...prev, error: error.message || 'Failed to claim roster character.' }));
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
