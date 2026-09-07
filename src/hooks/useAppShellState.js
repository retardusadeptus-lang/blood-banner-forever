import { useMemo } from 'react';

export default function useAppShellState({
  canSaveChanges = true,
  hasLootUnsavedChanges,
  hasItemsDbUnsavedChanges,
  hasRosterUnsavedChanges,
  hasScoringUnsavedChanges,
  hasConfigUnsavedChanges,
  hasRaidAssignmentsUnsavedChanges,
  adminData,
  handleSaveLootCouncilChanges,
  handleSaveRaidAssignmentsChanges,
  handleSaveRosterAttendanceChanges,
  handleSaveScoringChanges,
  handleSaveItemsDbChanges,
  handleSaveAdminChanges,
}) {
  const hasAnyUnsavedChanges = useMemo(() =>
    canSaveChanges && (hasLootUnsavedChanges || hasItemsDbUnsavedChanges || hasRosterUnsavedChanges || hasScoringUnsavedChanges || hasRaidAssignmentsUnsavedChanges || adminData?.hasAdminUnsavedChanges),
    [
      canSaveChanges,
      hasLootUnsavedChanges,
      hasItemsDbUnsavedChanges,
      hasRosterUnsavedChanges,
      hasScoringUnsavedChanges,
      hasRaidAssignmentsUnsavedChanges,
      adminData?.hasAdminUnsavedChanges,
    ]
  );

  const unsavedSections = useMemo(() => [
    canSaveChanges && hasLootUnsavedChanges ? 'Loot Council' : null,
    canSaveChanges && hasRaidAssignmentsUnsavedChanges ? 'Raid Assignments' : null,
    canSaveChanges && hasRosterUnsavedChanges ? 'Roster' : null,
    canSaveChanges && hasConfigUnsavedChanges ? 'Config' : null,
    canSaveChanges && hasScoringUnsavedChanges && !hasConfigUnsavedChanges ? 'Scoring' : null,
    canSaveChanges && hasItemsDbUnsavedChanges ? 'Items DB' : null,
    canSaveChanges && adminData?.officerRolesDirty ? 'Officer Roles' : null,
    canSaveChanges && adminData?.discordBotConfigDirty ? 'Discord Config' : null,
    canSaveChanges && adminData?.todoDirty ? 'To-do List' : null,
  ].filter(Boolean), [
    canSaveChanges,
    hasLootUnsavedChanges,
    hasRaidAssignmentsUnsavedChanges,
    hasRosterUnsavedChanges,
    hasScoringUnsavedChanges,
    hasConfigUnsavedChanges,
    hasItemsDbUnsavedChanges,
    adminData?.officerRolesDirty,
    adminData?.discordBotConfigDirty,
    adminData?.todoDirty,
  ]);

  const handleSaveAllChanges = async () => {
    if (!canSaveChanges || !hasAnyUnsavedChanges) return;
    try {
      if (hasLootUnsavedChanges) await handleSaveLootCouncilChanges({ silent: true });
      if (hasRaidAssignmentsUnsavedChanges) await handleSaveRaidAssignmentsChanges({ silent: true });
      if (hasRosterUnsavedChanges) await handleSaveRosterAttendanceChanges({ silent: true });
      if (hasScoringUnsavedChanges) await handleSaveScoringChanges({ silent: true });
      if (hasItemsDbUnsavedChanges) await handleSaveItemsDbChanges();
      if (adminData?.hasAdminUnsavedChanges) await handleSaveAdminChanges({ silent: true });
      alert('All pending changes saved.');
    } catch (error) {
      alert(error?.message || 'Failed to save all changes.');
    }
  };

  return {
    hasAnyUnsavedChanges,
    unsavedSections,
    handleSaveAllChanges,
  };
}
