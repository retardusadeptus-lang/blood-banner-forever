import BnetClaimModal from './BnetClaimModal';
import ItemIdEditorModal from './ItemIdEditorModal';
import LoginModal from './LoginModal';

export default function DashboardModals({
  showLoginModal,
  setShowLoginModal,
  adminAuthenticated,
  handleAdminLogin,
  handleAdminLogout,
  battletag,
  showBnetClaimModal,
  setShowBnetClaimModal,
  bnetAuthState,
  bnetClaimBusy,
  claimGameVersion,
  claimFallbackEnabled,
  handleBattleNetClaim,
  handleBattleNetManualClaim,
  handleBattleNetLogin,
  handleBattleNetLogout,
  roster,
  itemIdEditor,
  setItemIdEditor,
  handleSaveItemIdFromModal,
}) {
  return (
    <>
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        bnetAuthenticated={bnetAuthState.authenticated}
        battletag={battletag || bnetAuthState.user?.battletag}
        onBattleNetLogin={handleBattleNetLogin}
        onBattleNetLogout={handleBattleNetLogout}
        adminAuthenticated={adminAuthenticated}
        onAdminLogin={handleAdminLogin}
        onAdminLogout={handleAdminLogout}
      />

      <BnetClaimModal
        open={showBnetClaimModal}
        onClose={() => setShowBnetClaimModal(false)}
        isAuthenticated={bnetAuthState.authenticated}
        showBnetCharacterLookup={bnetAuthState.showBnetCharacterLookup}
        isLoading={bnetAuthState.loading || bnetClaimBusy}
        error={bnetAuthState.error}
        characters={bnetAuthState.characters}
        selectedGameVersion={claimGameVersion}
        showManualFallback={claimFallbackEnabled}
        diagnostics={bnetAuthState.diagnostics}
        roster={roster}
        onClaim={handleBattleNetClaim}
        onManualClaim={handleBattleNetManualClaim}
        onLogin={handleBattleNetLogin}
        onLogout={handleBattleNetLogout}
        claimedRosterNames={new Set((roster || []).filter(player => player.user_id).map(player => String(player.name || '').trim().toLowerCase()))}
      />

      <ItemIdEditorModal
        open={Boolean(itemIdEditor)}
        item={itemIdEditor}
        onClose={() => setItemIdEditor(null)}
        onSave={handleSaveItemIdFromModal}
      />
    </>
  );
}
