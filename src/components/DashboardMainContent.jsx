import OverviewTab from './OverviewTab';
import AdminContainer from '../containers/AdminContainer';
import BankContainer from '../containers/BankContainer';
import ItemsDatabaseContainer from '../containers/ItemsDatabaseContainer';
import LootCouncilContainer from '../containers/LootCouncilContainer';
import RaidAssignmentsContainer from '../containers/RaidAssignmentsContainer';
import RaidAssignmentsHistory from './RaidAssignmentsHistory';
import AssignedLootOverview from './AssignedLootOverview';
import RaidSignupsContainer from '../containers/RaidSignupsContainer';
import RecruitmentFocusTab from './RecruitmentFocusTab';
import RecruitmentPlanningTab from './RecruitmentPlanningTab';
import RecruitmentApplicationsTab from './RecruitmentApplicationsTab';
import RosterContainer from '../containers/RosterContainer';
import ScoringContainer from '../containers/ScoringContainer';
import ResourcesTab from '../features/resources/ResourcesTab';

export default function DashboardMainContent({ viewModel }) {
  const {
    activeTab,
    bankSubTab,
    sharedRaidFilter,
    setSharedRaidFilter,
    sharedPhaseFilter,
    setSharedPhaseFilter,
    raidAssignmentsSubTab,
    raidSignupsSubTab,
    setRaidSignupsSubTab,
    lootSubTab,
    recruitmentSubTab,
    adminSubTab,
    resourcesSubTab,
    isAuthenticated,
    globalMyPlayerId,
    selectedBisSpec,
    setSelectedBisSpec,
    selectedMyPlayerName,
    bnetAuthState,
    hasLootUnsavedChanges,
    handleSaveLootCouncilChanges,
    handleOpenItemForLootAssignment,
    handleClearOverviewItemPriorities,
    handleToggleAwardedPriority,
    handleSaveRaidAssignmentsChanges,
    isSavingRaidAssignments,
    handleCopyRaidAssignmentsToArchive,
    handleViewRaidAssignmentArchive,
    handleDeleteRaidAssignmentArchive,
    handleRestoreRaidAssignmentArchive,
    handleToggleRaidRestoreBoss,
    handleToggleZone,
    handleToggleBoss,
    handleMoveEnabledBoss,
    handleAddCustomRaidBoss,
    handleRemoveCustomRaidBoss,
    fetchData,
    putData,
    postData,
    deleteData,
    roster,
    specsFromDb,
    specsByName,
    getDisplayFromId,
    getSpecById,
    getSlugFromDisplay,
    getRankBadgeStyle,
    renderItemLink,
    hideWowheadTooltip,
    calculateScore,
    overviewSearch,
    setOverviewSearch,
    filteredOverviewItems,
    assignments,
    selectedItemName,
    setSelectedItemName,
    searchQuery,
    setSearchQuery,
    filterZone,
    setFilterZone,
    uniqueZones,
    filterBoss,
    setFilterBoss,
    uniqueBosses,
    filterSlot,
    setFilterSlot,
    uniqueSlots,
    filterCategory,
    setFilterCategory,
    filteredItems,
    selectedItem,
    sortedEligiblePlayers,
    getPlayerItemPriorityStatus,
    handleSetPriority,
    PlayerNameWithScore,
    assignmentsDirty,
    isSavingLootCouncil,
    mutableItems,
    bisPriorities,
    globalPhase,
    raidAssignmentArchives,
    selectedRaidAssignmentArchiveId,
    selectedRaidRestoreBosses,
    setSelectedRaidRestoreBosses,
    raidAssignmentData,
    setRaidAssignmentData,
    enabledBosses,
    raidAssignmentDataDirty,
    enabledBossesDirty,
    raidZones,
    customRaidGroups,
    recentRaidHelperImportedIds,
    recentRaidHelperSpecConflictIds,
    raidHelperImportSession,
    handleImportRaidHelperJson,
    handleUpdateRaidHelperImportEntry,
    handleApplyRaidHelperImport,
    handleCancelRaidHelperImport,
    handleSaveScoringChanges,
    scoringConfig,
    setScoringConfig,
    playerStats,
    expandedPlayerId,
    setExpandedPlayerId,
    calculateAttendance,
    updatePlayerStat,
    updatePlayerParse,
    updatePlayerManualAdjustment,
    scoringConfigDirty,
    playerStatsDirty,
    isSavingScoring,
    dbNewName,
    setDbNewName,
    dbNewSlot,
    setDbNewSlot,
    dbNewZone,
    setDbNewZone,
    dbNewBoss,
    setDbNewBoss,
    dbNewItemId,
    setDbNewItemId,
    handleAddItemToDb,
    dbSearch,
    setDbSearch,
    dbPageSize,
    setDbPageSize,
    dbPage,
    setDbPage,
    showMissingWowheadFilter,
    setShowMissingWowheadFilter,
    showWowheadNameMismatchFilter,
    setShowWowheadNameMismatchFilter,
    dbFilteredItems,
    specsSortedByClass,
    dbBisPriorities,
    handleUpdateItemEligibility,
    handleUpdateItemId,
    handleUpdateItemSource,
    handleDeleteItemFromDb,
    masterItemsDbPhase,
    setMasterItemsDbPhase,
    dbBisPrioritiesDirty,
    mutableItemsDirty,
    isSavingItemsDb,
    handleSaveItemsDbChanges,
    onSaveRosterAttendanceChanges,
    isSavingRosterAttendance,
    setNewRaidDate,
    setNewRaidZone,
    newRaidDate,
    newRaidZone,
    handleSaveRaidLog,
    raidLogs,
    handleApplyRaidSignupGroupsToAttendance,
    handleDeleteRaidLog,
    handleAddPlayer,
    newName,
    setNewName,
    newSpec,
    setNewSpec,
    setAllRaidStatus,
    toggleRaidStatus,
    handleUpdatePlayer,
    handleRemovePlayer,
    rosterDirty,
    raidLogsDirty,
    rosterClaims,
    handleUnclaimClaim,
    adminData,
    renderItemSlot,
  } = viewModel;

  const scoringTabProps = {
    scoringConfig,
    setScoringConfig,
    roster,
    playerStats,
    expandedPlayerId,
    setExpandedPlayerId,
    getSpecById,
    getDisplayFromId,
    calculateAttendance,
    updatePlayerStat,
    updatePlayerParse,
    updatePlayerManualAdjustment,
    PlayerNameWithScore,
    hasUnsavedChanges: scoringConfigDirty || playerStatsDirty,
    onSaveChanges: handleSaveScoringChanges,
    isSaving: isSavingScoring,
  };

  const itemsDbTabProps = {
    dbNewName,
    setDbNewName,
    dbNewSlot,
    setDbNewSlot,
    dbNewZone,
    setDbNewZone,
    dbNewBoss,
    setDbNewBoss,
    dbNewItemId,
    setDbNewItemId,
    handleAddItemToDb,
    dbSearch,
    setDbSearch,
    dbPageSize,
    setDbPageSize,
    dbPage,
    setDbPage,
    showMissingWowheadFilter,
    setShowMissingWowheadFilter,
    showWowheadNameMismatchFilter,
    setShowWowheadNameMismatchFilter,
    dbFilteredItems,
    specsSortedByClass,
    dbBisPriorities,
    handleUpdateItemEligibility,
    handleUpdateItemId,
    handleUpdateItemSource,
    handleDeleteItemFromDb,
    renderItemLink,
    masterItemsDbPhase,
    setMasterItemsDbPhase,
    hasUnsavedChanges: dbBisPrioritiesDirty || mutableItemsDirty,
    onSaveChanges: handleSaveItemsDbChanges,
    isSaving: isSavingItemsDb,
  };

  const rosterTabProps = {
    fetchData,
    handleSaveRaidLog,
    handleApplyRaidSignupGroupsToAttendance,
    newRaidDate,
    setNewRaidDate,
    newRaidZone,
    setNewRaidZone,
    raidLogs,
    handleDeleteRaidLog,
    handleAddPlayer,
    newName,
    setNewName,
    newSpec,
    setNewSpec,
    specsFromDb,
    setAllRaidStatus,
    roster,
    getSpecById,
    toggleRaidStatus,
    handleUpdatePlayer,
    handleRemovePlayer,
    importedRaidHelperPlayerIds: recentRaidHelperImportedIds,
    importedRaidHelperSpecConflictIds: recentRaidHelperSpecConflictIds,
    raidHelperImportSession,
    onUpdateRaidHelperImportEntry: handleUpdateRaidHelperImportEntry,
    onApplyRaidHelperImport: handleApplyRaidHelperImport,
    onCancelRaidHelperImport: handleCancelRaidHelperImport,
    specsByName,
    PlayerNameWithScore,
    hasUnsavedChanges: rosterDirty || raidLogsDirty || playerStatsDirty,
    onSaveChanges: onSaveRosterAttendanceChanges,
    isSaving: isSavingRosterAttendance,
  };

  return (
    <>
      {activeTab === 'loot' && lootSubTab === 'overview' && (
        <OverviewTab
          filteredOverviewItems={filteredOverviewItems}
          overviewSearch={overviewSearch}
          setOverviewSearch={setOverviewSearch}
          roster={roster}
          assignments={assignments}
          calculateScore={calculateScore}
          getRankBadgeStyle={getRankBadgeStyle}
          renderItemLink={renderItemLink}
          hideWowheadTooltip={hideWowheadTooltip}
          isAuthenticated={isAuthenticated}
          setActiveTab={() => {}}
          setSearchQuery={setSearchQuery}
          setSelectedItemName={setSelectedItemName}
          onOpenItemAssignment={handleOpenItemForLootAssignment}
          specsByName={specsByName}
          getDisplayFromId={getDisplayFromId}
          myPlayerName={selectedMyPlayerName}
          onClearItemPriorities={handleClearOverviewItemPriorities}
          hasLootUnsavedChanges={hasLootUnsavedChanges}
          onSaveAssignments={handleSaveLootCouncilChanges}
          onEditItemId={() => {}}
        />
      )}

      {activeTab === 'bank' && (
        <BankContainer
          fetchData={fetchData}
          putData={putData}
          isAuthenticated={isAuthenticated}
          bnetAuthState={bnetAuthState}
          roster={roster}
          specsByName={specsByName}
          getDisplayFromId={getDisplayFromId}
          bankSubTab={bankSubTab}
          activeTab={activeTab}
          globalMyPlayerId={globalMyPlayerId}
        />
      )}

      {activeTab === 'raidAssignments' && (
        <div className="space-y-4">
          {raidAssignmentsSubTab === 'overview' && (
            <RaidAssignmentsContainer
              isAuthenticated={isAuthenticated}
              roster={roster}
              getSpecById={getSpecById}
              enabledBosses={enabledBosses}
              raidZones={raidZones}
              handleToggleZone={handleToggleZone}
              handleToggleBoss={handleToggleBoss}
              handleMoveEnabledBoss={handleMoveEnabledBoss}
              customRaidGroups={customRaidGroups}
              handleAddCustomRaidBoss={handleAddCustomRaidBoss}
              handleRemoveCustomRaidBoss={handleRemoveCustomRaidBoss}
              raidAssignmentData={raidAssignmentData}
              setRaidAssignmentData={setRaidAssignmentData}
              hasUnsavedChanges={raidAssignmentDataDirty || enabledBossesDirty}
              onSaveChanges={handleSaveRaidAssignmentsChanges}
              isSaving={isSavingRaidAssignments}
              myPlayerName={selectedMyPlayerName}
              actorBattleTag={bnetAuthState.user?.battletag || ''}
              onCopyToArchive={handleCopyRaidAssignmentsToArchive}
              selectedRaid={sharedRaidFilter}
              setSelectedRaid={setSharedRaidFilter}
              selectedPhase={sharedPhaseFilter}
              setSelectedPhase={setSharedPhaseFilter}
            />
          )}
          {raidAssignmentsSubTab === 'tactics' && (
            <ResourcesTab
              resourcesSubTab="tactics"
              selectedBisSpec={selectedBisSpec}
              setSelectedBisSpec={setSelectedBisSpec}
              masterItemsDbPhase={masterItemsDbPhase}
              setMasterItemsDbPhase={setMasterItemsDbPhase}
              specsFromDb={specsFromDb}
              renderItemSlot={renderItemSlot}
              specsByName={specsByName}
              fetchData={fetchData}
              postData={postData}
              putData={putData}
              deleteData={deleteData}
              canSubmitWeakauras={isAuthenticated}
              isAuthenticated={isAuthenticated}
              enabledBosses={enabledBosses}
            />
          )}
          {raidAssignmentsSubTab === 'history' && (
            <RaidAssignmentsHistory
              archives={raidAssignmentArchives}
              onViewArchive={handleViewRaidAssignmentArchive}
              onDeleteArchive={handleDeleteRaidAssignmentArchive}
              onRestoreArchive={handleRestoreRaidAssignmentArchive}
              selectedArchiveId={selectedRaidAssignmentArchiveId}
              selectedRestoreBosses={selectedRaidRestoreBosses}
              setSelectedRestoreBosses={setSelectedRaidRestoreBosses}
              onToggleRestoreBoss={handleToggleRaidRestoreBoss}
            />
          )}
        </div>
      )}

      {activeTab === 'raidSignups' && (
        <RaidSignupsContainer
          fetchData={fetchData}
          putData={putData}
          postData={postData}
          deleteData={deleteData}
          isAuthenticated={isAuthenticated}
          roster={roster}
          getSpecById={getSpecById}
          specsFromDb={specsFromDb}
          bnetAuthState={bnetAuthState}
          handleSaveRaidLog={handleSaveRaidLog}
          handleApplyRaidSignupGroupsToAttendance={handleApplyRaidSignupGroupsToAttendance}
          handleImportRaidHelperJson={handleImportRaidHelperJson}
          newRaidDate={newRaidDate}
          setNewRaidDate={setNewRaidDate}
          newRaidZone={newRaidZone}
          setNewRaidZone={setNewRaidZone}
          raidLogs={raidLogs}
          handleDeleteRaidLog={handleDeleteRaidLog}
          importedRaidHelperPlayerIds={recentRaidHelperImportedIds}
          importedRaidHelperSpecConflictIds={recentRaidHelperSpecConflictIds}
          raidHelperImportSession={raidHelperImportSession}
          onUpdateRaidHelperImportEntry={handleUpdateRaidHelperImportEntry}
          onApplyRaidHelperImport={handleApplyRaidHelperImport}
          onCancelRaidHelperImport={handleCancelRaidHelperImport}
          activeSection={raidSignupsSubTab}
          onSectionChange={(nextSection) => {
            if (!nextSection) return;
            setRaidSignupsSubTab?.(nextSection);
          }}
        />
      )}

      {activeTab === 'bankRequests' && (
        <BankContainer
          fetchData={fetchData}
          putData={putData}
          isAuthenticated={isAuthenticated}
          bnetAuthState={bnetAuthState}
          roster={roster}
          specsByName={specsByName}
          getDisplayFromId={getDisplayFromId}
          bankSubTab={bankSubTab}
          activeTab={activeTab}
          globalMyPlayerId={globalMyPlayerId}
        />
      )}

      {activeTab === 'loot' && (
        <div className="space-y-4">
          {lootSubTab === 'assignment' && isAuthenticated && (
            <LootCouncilContainer
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterZone={filterZone}
              setFilterZone={setFilterZone}
              uniqueZones={uniqueZones}
              filterBoss={filterBoss}
              setFilterBoss={setFilterBoss}
              uniqueBosses={uniqueBosses}
              filterSlot={filterSlot}
              setFilterSlot={setFilterSlot}
              uniqueSlots={uniqueSlots}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
              selectedItemName={selectedItemName}
              setSelectedItemName={setSelectedItemName}
              filteredItems={filteredItems}
              selectedItem={selectedItem}
              sortedEligiblePlayers={sortedEligiblePlayers}
              getDisplayFromId={getDisplayFromId}
              getSlugFromDisplay={getSlugFromDisplay}
              bisPriorities={bisPriorities}
              globalPhase={globalPhase}
              assignments={assignments}
              mutableItems={mutableItems}
              getPlayerItemPriorityStatus={getPlayerItemPriorityStatus}
              getSpecById={getSpecById}
              getRankBadgeStyle={getRankBadgeStyle}
              renderItemLink={renderItemLink}
              handleSetPriority={handleSetPriority}
              PlayerNameWithScore={PlayerNameWithScore}
              hasUnsavedChanges={assignmentsDirty}
              onSaveChanges={handleSaveLootCouncilChanges}
              onClearItemAssignments={handleClearOverviewItemPriorities}
              onToggleAwardedPriority={handleToggleAwardedPriority}
              isSaving={isSavingLootCouncil}
            />
          )}
          {lootSubTab === 'scoring' && isAuthenticated && <ScoringContainer {...scoringTabProps} />}
          {lootSubTab === 'assigned' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-100">Assigned Loot Overview</h3>
              <p className="text-sm text-slate-400">The current loot council priorities are grouped here for a quick review.</p>
              <AssignedLootOverview
                assignments={assignments}
                mutableItems={mutableItems}
                normalizeAwardedPlayerIds={() => []}
                renderItemLink={renderItemLink}
                roster={roster}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'roster' && isAuthenticated && <RosterContainer {...rosterTabProps} />}

      {activeTab === 'recruitmentPlanning' && isAuthenticated && recruitmentSubTab === 'planning' && (
        <RecruitmentPlanningTab
          roster={roster}
          specsFromDb={specsFromDb}
          fetchData={fetchData}
          putData={putData}
        />
      )}

      {activeTab === 'recruitmentFocus' && recruitmentSubTab === 'focus' && (
        <RecruitmentFocusTab
          isAuthenticated={isAuthenticated}
          specsFromDb={specsFromDb}
          fetchData={fetchData}
          putData={putData}
        />
      )}

      {activeTab === 'recruitmentApplications' && recruitmentSubTab === 'applications' && (
        <RecruitmentApplicationsTab
          isAuthenticated={Boolean(bnetAuthState?.authenticated || isAuthenticated)}
          bnetAuthState={bnetAuthState}
          fetchData={fetchData}
          postData={postData}
          putData={putData}
          isOfficer={Boolean(bnetAuthState?.isOfficer || bnetAuthState?.isAdmin || isAuthenticated)}
          canManageBlurb={Boolean(bnetAuthState?.isOfficer || bnetAuthState?.isAdmin || isAuthenticated)}
        />
      )}

      {(activeTab === 'officerRoles' || activeTab === 'discordBotConfig') && isAuthenticated && (
        <AdminContainer
          activeTab={activeTab}
          adminSubTab={adminSubTab}
          roster={roster}
          getSpecById={getSpecById}
          specsByName={specsByName}
          getDisplayFromId={getDisplayFromId}
          myPlayerId={globalMyPlayerId}
          selectedMyPlayerName={selectedMyPlayerName}
          rosterClaims={rosterClaims}
          handleUnclaimClaim={handleUnclaimClaim}
          adminData={adminData}
          setScoringConfig={setScoringConfig}
          scoringConfig={scoringConfig}
          scoringConfigDirty={scoringConfigDirty}
          bnetAuthState={bnetAuthState}
        />
      )}

      {activeTab === 'scoring' && isAuthenticated && <ScoringContainer {...scoringTabProps} />}

      {activeTab === 'bis' && (
        <ResourcesTab
          resourcesSubTab={resourcesSubTab}
          selectedBisSpec={selectedBisSpec}
          setSelectedBisSpec={setSelectedBisSpec}
          masterItemsDbPhase={masterItemsDbPhase}
          setMasterItemsDbPhase={setMasterItemsDbPhase}
          specsFromDb={specsFromDb}
          renderItemSlot={renderItemSlot}
          specsByName={specsByName}
          fetchData={fetchData}
          postData={postData}
          putData={putData}
          deleteData={deleteData}
          canSubmitWeakauras={isAuthenticated}
          isAuthenticated={isAuthenticated}
          enabledBosses={enabledBosses}
        />
      )}

      {activeTab === 'itemsdb' && isAuthenticated && <ItemsDatabaseContainer {...itemsDbTabProps} />}
    </>
  );
}
