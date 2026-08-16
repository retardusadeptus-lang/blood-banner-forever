import AdminTodoTab from '../features/admin/AdminTodoTab';
import SiteInstructionsAdminTab from '../features/admin/SiteInstructionsAdminTab';
import OfficerRolesTab from '../components/OfficerRolesTab';
import DiscordBotConfigTab from '../components/DiscordBotConfigTab';

export default function AdminContainer({
  activeTab,
  adminSubTab,
  roster,
  getSpecById,
  specsByName,
  getDisplayFromId,
  myPlayerId,
  selectedMyPlayerName,
  rosterClaims,
  handleUnclaimClaim,
  adminData,
  setScoringConfig,
  scoringConfig,
  scoringConfigDirty,
  bnetAuthState
}) {
  const {
    officerRoles,
    setOfficerRoles,
    officerRolesDirty,
    bnetAccessRoles,
    bnetAccessRoleCandidates,
    bnetAccessRolesDirty,
    setBnetAccessRoleForUser,
    removeBnetAccessRoleForUser,
    discordBotConfig,
    setDiscordBotConfig,
    discordBotConfigDirty,
    isSavingOfficerRoles,
    isSavingBnetAccessRoles,
    isSavingDiscordBotConfig,
    handleSaveOfficerRoles,
    handleSaveBnetAccessRoles,
    handleSaveDiscordBotConfig
  } = adminData;

  if (activeTab === 'officerRoles') {
    return (
      <div className="space-y-4">
        {adminSubTab === 'officerRoles' && (
          <OfficerRolesTab
            roster={roster}
            getSpecById={getSpecById}
            officerRoles={officerRoles}
            setOfficerRoles={setOfficerRoles}
            bnetAccessRoles={bnetAccessRoles}
            bnetAccessRoleCandidates={bnetAccessRoleCandidates}
            bnetAccessRolesDirty={bnetAccessRolesDirty}
            onSetBnetAccessRole={setBnetAccessRoleForUser}
            onRemoveBnetAccessRole={removeBnetAccessRoleForUser}
            myPlayerId={myPlayerId}
            hasUnsavedChanges={officerRolesDirty}
            onSaveChanges={handleSaveOfficerRoles}
            isSaving={isSavingOfficerRoles}
            onSaveBnetAccessRoles={handleSaveBnetAccessRoles}
            isSavingBnetAccessRoles={isSavingBnetAccessRoles}
          />
        )}
        {adminSubTab === 'config' && (
          <DiscordBotConfigTab
            config={discordBotConfig}
            setConfig={setDiscordBotConfig}
            hasUnsavedChanges={discordBotConfigDirty || scoringConfigDirty}
            onSaveChanges={handleSaveDiscordBotConfig}
            isSaving={isSavingDiscordBotConfig}
            claims={rosterClaims}
            onUnclaimClaim={handleUnclaimClaim}
            roster={roster}
            specsByName={specsByName}
            getDisplayFromId={getDisplayFromId}
            scoringConfig={scoringConfig}
            setScoringConfig={setScoringConfig}
            bnetAuthState={bnetAuthState}
          />
        )}
        {adminSubTab === 'itemsdb' && (
          <div className="text-slate-300">Master Items DB is still handled by ItemsDatabaseContainer.</div>
        )}
        {adminSubTab === 'todo' && (
          <AdminTodoTab
            selectedMyPlayerName={selectedMyPlayerName}
            roster={roster}
            todoDraftItems={adminData.todoDraftItems}
            todoFilterMine={adminData.todoFilterMine}
            todoDirty={adminData.todoDirty}
            onToggleTodoFilterMine={adminData.setTodoFilterMine}
            onAddTodoItem={adminData.handleAddTodoItem}
            onUpdateTodoItem={adminData.handleUpdateTodoItem}
            onRemoveTodoItem={adminData.handleRemoveTodoItem}
            onSaveTodoItems={adminData.handleSaveTodoItems}
          />
        )}
        {adminSubTab === 'instructions' && (
          <SiteInstructionsAdminTab />
        )}
      </div>
    );
  }

  if (activeTab === 'discordBotConfig') {
    return (
      <DiscordBotConfigTab
        config={discordBotConfig}
        setConfig={setDiscordBotConfig}
        hasUnsavedChanges={discordBotConfigDirty || scoringConfigDirty}
        onSaveChanges={handleSaveDiscordBotConfig}
        isSaving={isSavingDiscordBotConfig}
        claims={rosterClaims}
        onUnclaimClaim={handleUnclaimClaim}
        roster={roster}
        specsByName={specsByName}
        getDisplayFromId={getDisplayFromId}
        scoringConfig={scoringConfig}
        setScoringConfig={setScoringConfig}
        bnetAuthState={bnetAuthState}
      />
    );
  }

  return null;
}
