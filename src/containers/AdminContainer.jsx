import AdminTodoTab from '../features/admin/AdminTodoTab';
import OfficerRolesTab from '../components/OfficerRolesTab';
import DiscordBotConfigTab from '../components/DiscordBotConfigTab';

export default function AdminContainer({
  activeTab,
  adminSubTab,
  roster,
  getSpecById,
  specsByName,
  getDisplayFromId,
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
    discordBotConfig,
    setDiscordBotConfig,
    discordBotConfigDirty,
    isSavingOfficerRoles,
    isSavingDiscordBotConfig,
    handleSaveOfficerRoles,
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
            myPlayerId={selectedMyPlayerName}
            hasUnsavedChanges={officerRolesDirty}
            onSaveChanges={handleSaveOfficerRoles}
            isSaving={isSavingOfficerRoles}
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
