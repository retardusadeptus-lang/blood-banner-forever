import React from 'react';
import BnetClaimModal from './BnetClaimModal';
import ItemIdEditorModal from './ItemIdEditorModal';

export default function DashboardModals({
  showBnetClaimModal,
  setShowBnetClaimModal,
  bnetAuthState,
  bnetClaimBusy,
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
      <BnetClaimModal
        open={showBnetClaimModal}
        onClose={() => setShowBnetClaimModal(false)}
        isAuthenticated={bnetAuthState.authenticated}
        showBnetCharacterLookup={bnetAuthState.showBnetCharacterLookup}
        isLoading={bnetAuthState.loading || bnetClaimBusy}
        error={bnetAuthState.error}
        characters={bnetAuthState.characters}
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
