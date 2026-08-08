import { useMemo } from 'react';

export default function useAppShellState({
  hasLootUnsavedChanges,
  hasItemsDbUnsavedChanges,
  hasRosterUnsavedChanges,
  hasScoringUnsavedChanges,
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
    hasLootUnsavedChanges || hasItemsDbUnsavedChanges || hasRosterUnsavedChanges || hasScoringUnsavedChanges || hasRaidAssignmentsUnsavedChanges || adminData?.hasAdminUnsavedChanges,
    [
      hasLootUnsavedChanges,
      hasItemsDbUnsavedChanges,
      hasRosterUnsavedChanges,
      hasScoringUnsavedChanges,
      hasRaidAssignmentsUnsavedChanges,
      adminData?.hasAdminUnsavedChanges,
    ]
  );

  const unsavedSections = useMemo(() => [
    hasLootUnsavedChanges ? 'Loot Council' : null,
    hasRaidAssignmentsUnsavedChanges ? 'Raid Assignments' : null,
    hasRosterUnsavedChanges ? 'Roster' : null,
    hasScoringUnsavedChanges ? 'Scoring' : null,
    hasItemsDbUnsavedChanges ? 'Items DB' : null,
    adminData?.officerRolesDirty ? 'Officer Roles' : null,
    adminData?.discordBotConfigDirty ? 'Discord Config' : null,
    adminData?.todoDirty ? 'To-do List' : null,
  ].filter(Boolean), [
    hasLootUnsavedChanges,
    hasRaidAssignmentsUnsavedChanges,
    hasRosterUnsavedChanges,
    hasScoringUnsavedChanges,
    hasItemsDbUnsavedChanges,
    adminData?.officerRolesDirty,
    adminData?.discordBotConfigDirty,
    adminData?.todoDirty,
  ]);

  const handleSaveAllChanges = async () => {
    if (!hasAnyUnsavedChanges) return;
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
