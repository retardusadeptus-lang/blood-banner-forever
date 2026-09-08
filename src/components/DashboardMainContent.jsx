import OverviewTab from './OverviewTab';
import AdminContainer from '../containers/AdminContainer';
import BankContainer from '../containers/BankContainer';
import ItemsDatabaseContainer from '../containers/ItemsDatabaseContainer';
import LootCouncilContainer from '../containers/LootCouncilContainer';
import RaidAssignmentsContainer from '../containers/RaidAssignmentsContainer';
import AssignedLootOverview from './AssignedLootOverview';
import RaidSignupsContainer from '../containers/RaidSignupsContainer';
import RecruitmentFocusTab from './RecruitmentFocusTab';
import RecruitmentPlanningTab from './RecruitmentPlanningTab';
import RecruitmentApplicationsTab from './RecruitmentApplicationsTab';
import ScoringContainer from '../containers/ScoringContainer';
import ResourcesTab from '../features/resources/ResourcesTab';
import { getSiteTabContentOwner, getSiteTabMetadata } from '../config/siteRegistry';

export default function DashboardMainContent({ viewModel }) {
  const {
    activeTab,
    activeSiteTabId,
    bankSubTab,
    sharedRaidFilter,
    setSharedRaidFilter,
    sharedPhaseFilter,
    setSharedPhaseFilter,
    raidAssignmentsBossFilter,
    setRaidAssignmentsBossFilter,
    tacticsBossFilter,
    setTacticsBossFilter,
    raidSignupsSubTab,
    setRaidSignupsSubTab,
    priorityPhase,
    setPriorityPhase,
    adminSubTab,
    resourcesSubTab,
    isAuthenticated,
    canViewScoring,
    globalMyPlayerId,
    selectedBisSpec,
    setSelectedBisSpec,
    selectedMyPlayerName,
    bnetAuthState,
    loot,
    raidAssignments,
    api,
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
    PlayerNameWithScore,
    globalPhase,
    recentRaidHelperImportedIds,
    recentRaidHelperSpecConflictIds,
    raidHelperImportSession,
    handleImportRaidHelperJson,
    handleUpdateRaidHelperImportEntry,
    handleApplyRaidHelperImport,
    handleCancelRaidHelperImport,
    scoring,
    itemsDb,
    rosterModel,
    admin,
    renderItemSlot,
  } = viewModel;

  const {
    config: scoringConfig,
    setConfig: setScoringConfig,
    playerStats,
    expandedPlayerId,
    setExpandedPlayerId,
    calculateAttendance,
    updatePlayerStat,
    updatePlayerParse,
    updatePlayerManualAdjustment,
    configDirty: scoringConfigDirty,
    playerStatsDirty,
    isSaving: isSavingScoring,
    onSaveChanges: handleSaveScoringChanges,
  } = scoring;

  const {
    newName: dbNewName,
    setNewName: setDbNewName,
    newSlot: dbNewSlot,
    setNewSlot: setDbNewSlot,
    newZone: dbNewZone,
    setNewZone: setDbNewZone,
    newBoss: dbNewBoss,
    setNewBoss: setDbNewBoss,
    newItemId: dbNewItemId,
    setNewItemId: setDbNewItemId,
    handleAddItem: handleAddItemToDb,
    search: dbSearch,
    setSearch: setDbSearch,
    pageSize: dbPageSize,
    setPageSize: setDbPageSize,
    page: dbPage,
    setPage: setDbPage,
    showMissingWowheadFilter,
    setShowMissingWowheadFilter,
    showWowheadNameMismatchFilter,
    setShowWowheadNameMismatchFilter,
    filteredItems: dbFilteredItems,
    specsSortedByClass,
    bisPriorities: dbBisPriorities,
    handleUpdateItemEligibility,
    handleUpdateItemId,
    handleUpdateItemSource,
    handleDeleteItem: handleDeleteItemFromDb,
    phase: masterItemsDbPhase,
    setPhase: setMasterItemsDbPhase,
    bisPrioritiesDirty: dbBisPrioritiesDirty,
    mutableItemsDirty,
    isSaving: isSavingItemsDb,
    onSaveChanges: handleSaveItemsDbChanges,
  } = itemsDb;

  const {
    onSaveChanges: onSaveRosterAttendanceChanges,
    isSaving: isSavingRosterAttendance,
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
    dirty: rosterDirty,
  } = rosterModel;

  const { siteVisibility } = admin;

  const { fetchData, putData, postData, deleteData } = api;

  const directoryContext = {
    roster,
    specsFromDb,
    specsByName,
    getDisplayFromId,
    getSpecById,
    getSlugFromDisplay,
    getRankBadgeStyle,
    renderItemLink,
    hideWowheadTooltip,
    PlayerNameWithScore,
    calculateScore,
  };
  const sessionContext = { isAuthenticated, bnetAuthState };
  const navigationContext = {
    activeTab,
    bankSubTab,
    sharedRaidFilter,
    setSharedRaidFilter,
    sharedPhaseFilter,
    setSharedPhaseFilter,
    globalPhase,
    raidAssignmentsBossFilter,
    setRaidAssignmentsBossFilter,
    raidSignupsSubTab,
    setRaidSignupsSubTab,
  };
  const raidSignupsAttendance = {
    handleSaveRaidLog,
    handleApplyRaidSignupGroupsToAttendance,
    newRaidDate,
    setNewRaidDate,
    newRaidZone,
    setNewRaidZone,
    raidLogs,
    handleDeleteRaidLog,
  };
  const raidSignupsHelper = {
    handleImportRaidHelperJson,
    importedRaidHelperPlayerIds: recentRaidHelperImportedIds,
    importedRaidHelperSpecConflictIds: recentRaidHelperSpecConflictIds,
    raidHelperImportSession,
    onUpdateRaidHelperImportEntry: handleUpdateRaidHelperImportEntry,
    onApplyRaidHelperImport: handleApplyRaidHelperImport,
    onCancelRaidHelperImport: handleCancelRaidHelperImport,
  };
  const adminNavigation = {
    activeTab,
    adminSubTab,
    myPlayerId: globalMyPlayerId,
    selectedMyPlayerName,
  };
  const adminSession = {
    ...sessionContext,
    fetchData,
  };
  const adminRosterModel = {
    ...rosterModel,
    guildRoleRanks: scoringConfig?.guildRoleRanks,
  };

  const {
    hasUnsavedChanges: hasLootUnsavedChanges,
    onSaveChanges: handleSaveLootCouncilChanges,
    onOpenItemAssignment: handleOpenItemForLootAssignment,
    onClearItemPriorities: handleClearOverviewItemPriorities,
    overviewSearch,
    setOverviewSearch,
    filteredOverviewItems,
    assignments,
    setSelectedItemName,
    setSearchQuery,
    normalizeAwardedPlayerIds,
    mutableItems,
  } = loot;

  const {
    enabledBosses,
    raidZones,
  } = raidAssignments;

  const activeContentOwner = getSiteTabContentOwner(activeSiteTabId);
  const siteTabMetadata = getSiteTabMetadata(activeSiteTabId, siteVisibility);

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
    hasUnsavedChanges: rosterDirty,
    onSaveChanges: onSaveRosterAttendanceChanges,
    isSaving: isSavingRosterAttendance,
  };

  return (
    <>
      {activeSiteTabId === 'loot.overview' && activeContentOwner === 'LootCouncilContainer' && (
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
          priorityPhase={priorityPhase}
          setPriorityPhase={setPriorityPhase}
          siteTabMetadata={siteTabMetadata}
        />
      )}

      {activeContentOwner === 'BankContainer' && activeSiteTabId?.startsWith('guild-bank.') && (
        <BankContainer
          api={api}
          session={sessionContext}
          directory={{ roster, specsByName, getDisplayFromId }}
          navigation={{ activeTab, bankSubTab, globalMyPlayerId }}
          siteTabMetadata={siteTabMetadata}
        />
      )}

      {activeContentOwner === 'RaidAssignmentsContainer' && activeSiteTabId === 'raid-assignments.overview' && (
        <div className="space-y-4">
            <RaidAssignmentsContainer
              raidAssignments={raidAssignments}
              session={{ ...sessionContext, myPlayerName: selectedMyPlayerName }}
              directory={{ roster, getSpecById }}
              navigation={navigationContext}
              api={{ fetchData }}
              siteTabMetadata={siteTabMetadata}
            />
        </div>
      )}

      {activeContentOwner === 'RaidSignupsContainer' && activeSiteTabId?.startsWith('raid-signups.') && (
        <RaidSignupsContainer
          api={api}
          session={{ ...sessionContext, guildRoleRanks: scoringConfig?.guildRoleRanks }}
          directory={{ roster, getSpecById, specsFromDb }}
          attendance={raidSignupsAttendance}
          raidHelper={raidSignupsHelper}
          navigation={navigationContext}
              sectionVisibilityById={siteVisibility?.sectionVisibilityById}
          siteTabMetadata={siteTabMetadata}
        />
      )}

      {activeContentOwner === 'LootCouncilContainer' && (
        <div className="space-y-4">
          {activeSiteTabId === 'loot.assignment' && isAuthenticated && (
            <LootCouncilContainer
              loot={loot}
              directory={directoryContext}
              phase={{ globalPhase, priorityPhase, setPriorityPhase }}
              siteTabMetadata={siteTabMetadata}
            />
          )}
          {activeSiteTabId === 'loot.assigned' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-100">Assigned Loot Overview</h3>
              <p className="text-sm text-slate-400">The current loot council priorities are grouped here for a quick review.</p>
              <AssignedLootOverview
                assignments={assignments}
                mutableItems={mutableItems}
                normalizeAwardedPlayerIds={normalizeAwardedPlayerIds}
                renderItemLink={renderItemLink}
                roster={roster}
                getSpecById={getSpecById}
                onOpenItemAssignment={handleOpenItemForLootAssignment}
                isAuthenticated={isAuthenticated}
              />
            </div>
          )}
        </div>
      )}

      {activeSiteTabId === 'recruitment.planning' && isAuthenticated && (
        <RecruitmentPlanningTab
          roster={roster}
          specsFromDb={specsFromDb}
          fetchData={fetchData}
          putData={putData}
          rosterManagementProps={rosterTabProps}
          siteTabMetadata={siteTabMetadata}
        />
      )}

      {activeSiteTabId === 'recruitment.focus' && (
        <RecruitmentFocusTab
          isAuthenticated={isAuthenticated}
          specsFromDb={specsFromDb}
          fetchData={fetchData}
          putData={putData}
          siteTabMetadata={siteTabMetadata}
        />
      )}

      {activeSiteTabId === 'recruitment.applications' && (
        <RecruitmentApplicationsTab
          isAuthenticated={Boolean(bnetAuthState?.authenticated || isAuthenticated)}
          bnetAuthState={bnetAuthState}
          fetchData={fetchData}
          postData={postData}
          putData={putData}
          deleteData={deleteData}
          isOfficer={Boolean(bnetAuthState?.isOfficer || bnetAuthState?.isAdmin || isAuthenticated)}
          canManageBlurb={Boolean(bnetAuthState?.isOfficer || bnetAuthState?.isAdmin || isAuthenticated)}
          siteTabMetadata={siteTabMetadata}
        />
      )}

      {activeContentOwner === 'AdminContainer' && ['admin.officerRoles', 'admin.roster', 'admin.config', 'admin.todo'].includes(activeSiteTabId) && isAuthenticated && (
        <AdminContainer
          navigation={adminNavigation}
          directory={directoryContext}
          admin={admin}
          scoring={scoring}
          session={adminSession}
          rosterModel={adminRosterModel}
          siteVisibility={siteVisibility}
          siteTabMetadata={siteTabMetadata}
        />
      )}

      {activeContentOwner === 'AdminContainer' && activeSiteTabId === 'admin.sitemap' && bnetAuthState?.isAdmin && (
        <AdminContainer
          navigation={adminNavigation}
          directory={directoryContext}
          admin={admin}
          scoring={scoring}
          session={adminSession}
          rosterModel={adminRosterModel}
          siteVisibility={siteVisibility}
          siteTabMetadata={siteTabMetadata}
        />
      )}

      {activeContentOwner === 'ItemsDatabaseContainer' && activeSiteTabId === 'admin.itemsdb' && isAuthenticated && (
        <ItemsDatabaseContainer
          itemsDb={itemsDbTabProps}
          siteTabMetadata={siteTabMetadata}
        />
      )}

      {activeSiteTabId === 'loot.scoring' && activeContentOwner === 'ScoringContainer' && canViewScoring && <ScoringContainer scoring={scoringTabProps} siteTabMetadata={siteTabMetadata} />}

      {activeContentOwner === 'ResourcesTab' && activeSiteTabId !== 'raid-assignments.tactics' && (
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
          raidZones={raidZones}
          userBossFilter={tacticsBossFilter}
          setUserBossFilter={setTacticsBossFilter}
          defaultPhase={globalPhase}
          roster={roster}
          selectedCharacterId={globalMyPlayerId}
          siteTabMetadata={siteTabMetadata}
        />
      )}

      {activeContentOwner === 'ResourcesTab' && activeSiteTabId === 'raid-assignments.tactics' && (
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
          raidZones={raidZones}
          userBossFilter={tacticsBossFilter}
          setUserBossFilter={setTacticsBossFilter}
          defaultPhase={globalPhase}
          roster={roster}
          selectedCharacterId={globalMyPlayerId}
          siteTabMetadata={siteTabMetadata}
        />
      )}

      {activeContentOwner === 'ItemsDatabaseContainer' && isAuthenticated && <ItemsDatabaseContainer itemsDb={itemsDbTabProps} siteTabMetadata={siteTabMetadata} />}
    </>
  );
}
