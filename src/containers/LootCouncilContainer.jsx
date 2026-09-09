import LootCouncilTab from '../components/LootCouncilTab';

export default function LootCouncilContainer({ loot, directory, phase, siteTabMetadata }) {
  return (
    <LootCouncilTab
      {...loot}
      getDisplayFromId={directory.getDisplayFromId}
      getSlugFromDisplay={directory.getSlugFromDisplay}
      getSpecById={directory.getSpecById}
      getRankBadgeStyle={directory.getRankBadgeStyle}
      renderItemLink={directory.renderItemLink}
      PlayerNameWithScore={directory.PlayerNameWithScore}
      globalPhase={phase.globalPhase}
      priorityPhase={phase.priorityPhase}
      setPriorityPhase={phase.setPriorityPhase}
      hasUnsavedChanges={loot.assignmentsDirty}
      onSaveChanges={loot.onSaveChanges}
      onClearItemAssignments={loot.onClearItemPriorities}
      onToggleAwardedPriority={loot.onToggleAwardedPriority}
      isSaving={loot.isSaving}
      siteTabMetadata={siteTabMetadata}
    />
  );
}
