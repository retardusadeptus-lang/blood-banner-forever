import AdminTodoTab from '../features/admin/AdminTodoTab';
// import SiteInstructionsAdminTab from '../features/admin/SiteInstructionsAdminTab';
import OfficerRolesTab from '../components/OfficerRolesTab';
import DiscordBotConfigTab from '../components/DiscordBotConfigTab';
import GuildRosterTab from '../components/GuildRosterTab';

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
  bnetAuthState,
  fetchData,
  specsFromDb,
  calculateScore,
  calculateAttendance,
  playerStats,
  guildRoleRanks,
  handleUpdatePlayer,
  handleRemovePlayer,
  rosterDirty,
  onSaveRosterChanges,
  isSavingRoster
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

  const resolvedAdminSubTab = activeTab === 'roster' ? 'roster' : adminSubTab;

  if (activeTab === 'officerRoles' || activeTab === 'roster') {
    return (
      <div className="space-y-4">
        {resolvedAdminSubTab === 'roster' && (
          <GuildRosterTab
            roster={roster}
            specsFromDb={specsFromDb}
            getSpecById={getSpecById}
            calculateScore={calculateScore}
            calculateAttendance={calculateAttendance}
            playerStats={playerStats}
            guildRoleRanks={guildRoleRanks}
            rosterClaims={rosterClaims}
            fetchData={fetchData}
            handleUpdatePlayer={handleUpdatePlayer}
            handleRemovePlayer={handleRemovePlayer}
            hasUnsavedChanges={rosterDirty}
            onSaveChanges={onSaveRosterChanges}
            isSaving={isSavingRoster}
          />
        )}
        {resolvedAdminSubTab === 'officerRoles' && (
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
        {resolvedAdminSubTab === 'config' && (
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
            bnetAccessRoles={bnetAccessRoles}
            bnetAccessRoleCandidates={bnetAccessRoleCandidates}
            bnetAccessRolesDirty={bnetAccessRolesDirty}
            onSetBnetAccessRole={setBnetAccessRoleForUser}
            onRemoveBnetAccessRole={removeBnetAccessRoleForUser}
            onSaveBnetAccessRoles={handleSaveBnetAccessRoles}
            isSavingBnetAccessRoles={isSavingBnetAccessRoles}
          />
        )}
        {resolvedAdminSubTab === 'itemsdb' && (
          <div className="text-slate-300">Master Items DB is still handled by ItemsDatabaseContainer.</div>
        )}
        {resolvedAdminSubTab === 'todo' && (
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
        {/* Site Instructions tab temporarily disabled. */}
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
        bnetAccessRoles={bnetAccessRoles}
        bnetAccessRoleCandidates={bnetAccessRoleCandidates}
        bnetAccessRolesDirty={bnetAccessRolesDirty}
        onSetBnetAccessRole={setBnetAccessRoleForUser}
        onRemoveBnetAccessRole={removeBnetAccessRoleForUser}
        onSaveBnetAccessRoles={handleSaveBnetAccessRoles}
        isSavingBnetAccessRoles={isSavingBnetAccessRoles}
      />
    );
  }

  return null;
}
