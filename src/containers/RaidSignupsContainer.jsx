import RaidSignupsTab from '../components/RaidSignupsTab';

export default function RaidSignupsContainer({ api, session, directory, attendance, raidHelper, navigation, sectionVisibilityById = {}, siteTabMetadata }) {
  return (
    <RaidSignupsTab
      {...api}
      isAuthenticated={session.isAuthenticated}
      roster={directory.roster}
      guildRoleRanks={session.guildRoleRanks}
      rosterClaims={session.rosterClaims}
      getSpecById={directory.getSpecById}
      specsFromDb={directory.specsFromDb}
      bnetAuthState={session.bnetAuthState}
      {...attendance}
      {...raidHelper}
      activeSection={navigation.raidSignupsSubTab}
      onSectionChange={navigation.setRaidSignupsSubTab}
      sectionVisibilityById={sectionVisibilityById}
      siteTabMetadata={siteTabMetadata}
    />
  );
}
