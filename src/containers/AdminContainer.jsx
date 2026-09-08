import AdminTodoTab from '../features/admin/AdminTodoTab';
// import SiteInstructionsAdminTab from '../features/admin/SiteInstructionsAdminTab';
import OfficerRolesTab from '../components/OfficerRolesTab';
import DiscordBotConfigTab from '../components/DiscordBotConfigTab';
import GuildRosterTab from '../components/GuildRosterTab';
import SitemapTab from '../components/SitemapTab';

export default function AdminContainer({ navigation, directory, admin, scoring, session, rosterModel, siteVisibility, siteTabMetadata }) {
  const {
    activeTab,
    adminSubTab,
    myPlayerId,
    selectedMyPlayerName,
  } = navigation;
  const {
    roster,
    getSpecById,
    specsByName,
    getDisplayFromId,
    specsFromDb,
    calculateScore,
  } = directory;
  const { rosterClaims, handleUnclaimClaim, data: adminData } = admin;
  const {
    setConfig: setScoringConfig,
    config: scoringConfig,
    configDirty: scoringConfigDirty,
    playerStats,
    calculateAttendance,
  } = scoring;
  const { bnetAuthState, fetchData } = session;
  const {
    guildRoleRanks,
    handleAddPlayer,
    newName,
    setNewName,
    newSpec,
    setNewSpec,
    handleUpdatePlayer,
    handleRemovePlayer,
    raidLogs,
    dirty: rosterDirty,
    onSaveChanges: onSaveRosterChanges,
    isSaving: isSavingRoster,
  } = rosterModel;
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

  const registryRoute = siteTabMetadata?.contentOwner === 'AdminContainer' ? siteTabMetadata.route : null;
  const resolvedActiveTab = registryRoute?.activeTab || activeTab;
  const resolvedAdminSubTab = registryRoute?.subTab || (resolvedActiveTab === 'roster' ? 'roster' : adminSubTab);

  if (resolvedActiveTab === 'officerRoles' || resolvedActiveTab === 'roster') {
    return (
      <div className="space-y-4">
        {resolvedAdminSubTab === 'roster' && (
          <GuildRosterTab
            roster={roster}
            specsFromDb={specsFromDb}
            getSpecById={getSpecById}
            handleAddPlayer={handleAddPlayer}
            newName={newName}
            setNewName={setNewName}
            newSpec={newSpec}
            setNewSpec={setNewSpec}
            calculateScore={calculateScore}
            calculateAttendance={calculateAttendance}
            raidLogs={raidLogs}
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
            discordRoles={adminData.discordRoles}
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

  if (resolvedActiveTab === 'sitemap') {
    return <SitemapTab {...siteVisibility} siteTabMetadata={siteTabMetadata} />;
  }

  if (resolvedActiveTab === 'discordBotConfig') {
    return (
      <DiscordBotConfigTab
        config={discordBotConfig}
        setConfig={setDiscordBotConfig}
        discordRoles={adminData.discordRoles}
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
