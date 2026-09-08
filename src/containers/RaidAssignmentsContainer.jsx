import RaidAssignmentsTab from '../components/RaidAssignmentsTab';

export default function RaidAssignmentsContainer({ raidAssignments, session, directory, navigation, api, siteTabMetadata }) {
  return (
    <RaidAssignmentsTab
      isAuthenticated={session.isAuthenticated}
      roster={directory.roster}
      getSpecById={directory.getSpecById}
      enabledBosses={raidAssignments.enabledBosses}
      raidZones={raidAssignments.raidZones}
      handleToggleZone={raidAssignments.toggleZone}
      handleToggleBoss={raidAssignments.toggleBoss}
      handleMoveEnabledBoss={raidAssignments.moveEnabledBoss}
      customRaidGroups={raidAssignments.customRaidGroups}
      handleAddCustomRaidBoss={raidAssignments.addCustomBoss}
      handleRemoveCustomRaidBoss={raidAssignments.removeCustomBoss}
      raidAssignmentData={raidAssignments.data}
      setRaidAssignmentData={raidAssignments.setData}
      hasUnsavedChanges={raidAssignments.dataDirty || raidAssignments.enabledBossesDirty}
      onSaveChanges={raidAssignments.onSaveChanges}
      isSaving={raidAssignments.isSaving}
      myPlayerName={session.myPlayerName}
      onCopyToArchive={raidAssignments.onCopyToArchive}
      actorBattleTag={session.bnetAuthState?.user?.battletag || ''}
      selectedRaid={navigation.sharedRaidFilter}
      setSelectedRaid={navigation.setSharedRaidFilter}
      selectedPhase={navigation.sharedPhaseFilter}
      setSelectedPhase={navigation.setSharedPhaseFilter}
      userBossFilter={navigation.raidAssignmentsBossFilter}
      setUserBossFilter={navigation.setRaidAssignmentsBossFilter}
      defaultPhase={navigation.globalPhase}
      fetchData={api.fetchData}
      siteTabMetadata={siteTabMetadata}
    />
  );
}
