import { useEffect, useState } from 'react';

export default function useAdminData({
  fetchData,
  putData,
  deleteData,
  activeTab,
  adminSubTab,
  scoringConfigDirty,
  setScoringConfigDirty,
  scoringConfig,
  setScoringConfigLocal,
  refreshRosterClaims,
  hasOfficerAccess = false
}) {
  const [officerRoles, setOfficerRoles] = useState([]);
  const [officerRolesDirty, setOfficerRolesDirty] = useState(false);
  const [bnetAccessRoles, setBnetAccessRoles] = useState([]);
  const [bnetAccessRoleCandidates, setBnetAccessRoleCandidates] = useState([]);
  const [bnetAccessRolesDirty, setBnetAccessRolesDirty] = useState(false);
  const [bnetAccessRolesBaseline, setBnetAccessRolesBaseline] = useState({});
  const [discordBotConfig, setDiscordBotConfig] = useState({
    request_roles: [],
    signup_roles: []
  });
  const [discordRoles, setDiscordRoles] = useState([]);
  const [discordBotConfigDirty, setDiscordBotConfigDirty] = useState(false);
  const [isSavingOfficerRoles, setIsSavingOfficerRoles] = useState(false);
  const [isSavingBnetAccessRoles, setIsSavingBnetAccessRoles] = useState(false);
  const [isSavingDiscordBotConfig, setIsSavingDiscordBotConfig] = useState(false);

  const [todoDraftItems, setTodoDraftItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin-todo-items') || '[]');
    } catch {
      return [];
    }
  });
  const [todoFilterMine, setTodoFilterMine] = useState(false);
  const [todoDirty, setTodoDirty] = useState(false);

  const setOfficerRolesData = (newValOrUpdater) => {
    setOfficerRoles(prev => {
      const next = typeof newValOrUpdater === 'function' ? newValOrUpdater(prev) : newValOrUpdater;
      return next;
    });
    setOfficerRolesDirty(true);
  };

  const setDiscordBotConfigData = (newValOrUpdater) => {
    setDiscordBotConfig(prev => {
      const next = typeof newValOrUpdater === 'function' ? newValOrUpdater(prev) : newValOrUpdater;
      return next;
    });
    setDiscordBotConfigDirty(true);
  };

  const setBnetAccessRoleForUser = (userId, role) => {
    const numericUserId = Number(userId || 0);
    if (!numericUserId) return;

    setBnetAccessRoles(prev => {
      const normalizedRole = role === 'admin' ? 'admin' : role === 'guild_member' ? 'guild_member' : 'officer';
      const existing = prev.find(item => Number(item.user_id) === numericUserId);
      if (!existing) {
        const user = bnetAccessRoleCandidates.find(candidate => Number(candidate.user_id) === numericUserId);
        return [
          ...prev,
          {
            user_id: numericUserId,
            battletag: String(user?.battletag || ''),
            blizzard_id: String(user?.blizzard_id || ''),
            role: normalizedRole,
            updated_at: null
          }
        ];
      }

      return prev.map(item => (
        Number(item.user_id) === numericUserId
          ? { ...item, role: normalizedRole }
          : item
      ));
    });
    setBnetAccessRolesDirty(true);
  };

  const removeBnetAccessRoleForUser = (userId) => {
    const numericUserId = Number(userId || 0);
    if (!numericUserId) return;
    setBnetAccessRoles(prev => prev.filter(item => Number(item.user_id) !== numericUserId));
    setBnetAccessRolesDirty(true);
  };

  useEffect(() => {
    localStorage.setItem('admin-todo-items', JSON.stringify(todoDraftItems));
  }, [todoDraftItems]);

  const handleAddTodoItem = () => {
    setTodoDraftItems(prev => [...prev, { id: Date.now(), item: '', owner: '', comments: '', status: 'Open' }]);
    setTodoDirty(true);
  };

  const handleUpdateTodoItem = (id, field, value) => {
    setTodoDraftItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    setTodoDirty(true);
  };

  const handleRemoveTodoItem = (id) => {
    setTodoDraftItems(prev => prev.filter(item => item.id !== id));
    setTodoDirty(true);
  };

  const handleSaveTodoItems = async ({ silent = false } = {}) => {
    localStorage.setItem('admin-todo-items', JSON.stringify(todoDraftItems));
    setTodoDirty(false);
    if (!silent) {
      alert('To-do list saved.');
    }
  };

  useEffect(() => {
    const shouldLoadOfficerRoles = activeTab === 'officerRoles' || adminSubTab === 'officerRoles' || activeTab === 'config' || adminSubTab === 'config';
    if (!hasOfficerAccess || !shouldLoadOfficerRoles || officerRolesDirty || bnetAccessRolesDirty) return;
    let mounted = true;

    const loadOfficerRoles = async () => {
      if (document.hidden) return;
      try {
        const [data, accessRoles, candidates] = await Promise.all([
          fetchData('officer-roles'),
          fetchData('bnet-access-roles').catch(() => []),
          fetchData('bnet-access-role-candidates').catch(() => [])
        ]);
        if (!mounted) return;
        setOfficerRoles(Array.isArray(data) ? data : []);
        const normalizedAccessRoles = Array.isArray(accessRoles) ? accessRoles : [];
        setBnetAccessRoles(normalizedAccessRoles);
        setBnetAccessRoleCandidates(Array.isArray(candidates) ? candidates : []);
        const nextBaseline = {};
        normalizedAccessRoles.forEach(item => {
          const id = Number(item.user_id || 0);
          if (id) {
            nextBaseline[id] = String(item.role || '').toLowerCase();
          }
        });
        setBnetAccessRolesBaseline(nextBaseline);
      } catch (error) {
        console.error('Failed to load officer roles:', error);
      }
    };

    loadOfficerRoles();
    return () => { mounted = false; };
  }, [fetchData, activeTab, adminSubTab, officerRolesDirty, bnetAccessRolesDirty, hasOfficerAccess]);

  useEffect(() => {
    const shouldLoadDiscordConfig = activeTab === 'discordBotConfig' || adminSubTab === 'config';
    if (!shouldLoadDiscordConfig || discordBotConfigDirty) return;
    let mounted = true;

    const loadDiscordBotConfig = async () => {
      if (document.hidden) return;
      try {
        const [data, roles] = await Promise.all([
          fetchData('discord-bot-config'),
          fetchData('discord-bot-roles').catch(() => [])
        ]);
        if (!mounted) return;
        setDiscordBotConfig({
          request_roles: Array.isArray(data?.request_roles) ? data.request_roles : [],
          signup_roles: Array.isArray(data?.signup_roles) ? data.signup_roles : []
        });
        setDiscordRoles(Array.isArray(roles) ? roles : []);
      } catch (error) {
        console.error('Failed to load Discord bot config:', error);
      }
      refreshRosterClaims?.();
    };

    loadDiscordBotConfig();
    return () => { mounted = false; };
  }, [fetchData, activeTab, adminSubTab, discordBotConfigDirty, refreshRosterClaims]);

  const handleSaveOfficerRoles = async ({ silent = false } = {}) => {
    if (!officerRolesDirty) return;
    setIsSavingOfficerRoles(true);
    try {
      await putData('officer-roles', officerRoles);
      setOfficerRolesDirty(false);
      if (!silent) alert('Officer roles saved.');
    } catch (error) {
      if (!silent) alert('Failed to save officer roles.');
      throw error;
    } finally {
      setIsSavingOfficerRoles(false);
    }
  };

  const handleSaveDiscordBotConfig = async ({ silent = false } = {}) => {
    if (!discordBotConfigDirty && !scoringConfigDirty) return;
    setIsSavingDiscordBotConfig(true);
    try {
      if (discordBotConfigDirty) {
        await putData('discord-bot-config', discordBotConfig);
      }
      if (scoringConfigDirty) {
        await putData('scoring-config', scoringConfig);
        const savedScoringConfig = await fetchData('scoring-config');
        const normalizeGuildRoleRanks = roles => (Array.isArray(roles) ? roles : []).map(role => ({
          name: String(role?.name || '').trim(),
          rank: Number(role?.rank) || 0,
          weight: Number(role?.weight ?? 1),
          isRaider: role?.isRaider === true
        }));
        const expectedGuildRoleRanks = normalizeGuildRoleRanks(scoringConfig?.guildRoleRanks);
        const savedGuildRoleRanks = normalizeGuildRoleRanks(savedScoringConfig?.guildRoleRanks);
        if (JSON.stringify(savedGuildRoleRanks) !== JSON.stringify(expectedGuildRoleRanks)) {
          throw new Error('The API did not return the saved guild role rankings. Restart or update the API server before saving scoring config.');
        }
        setScoringConfigLocal(savedScoringConfig);
      }
      setDiscordBotConfigDirty(false);
      setScoringConfigDirty(false);
      if (!silent) alert('Config changes saved.');
    } catch (error) {
      if (!silent) alert('Failed to save config changes.');
      throw error;
    } finally {
      setIsSavingDiscordBotConfig(false);
    }
  };

  const handleSaveBnetAccessRoles = async ({ silent = false } = {}) => {
    if (!bnetAccessRolesDirty) return;

    setIsSavingBnetAccessRoles(true);
    try {
      const nextMap = {};
      bnetAccessRoles.forEach(item => {
        const id = Number(item.user_id || 0);
        const role = String(item.role || '').toLowerCase();
        if (!id || (role !== 'admin' && role !== 'officer' && role !== 'guild_member')) return;
        nextMap[id] = role;
      });

      const prevMap = bnetAccessRolesBaseline || {};
      const upserts = [];
      const deletes = [];

      Object.entries(nextMap).forEach(([rawUserId, role]) => {
        const userId = Number(rawUserId);
        if (!userId) return;
        if (prevMap[userId] !== role) {
          upserts.push({ userId, role });
        }
      });

      Object.keys(prevMap).forEach(rawUserId => {
        const userId = Number(rawUserId);
        if (!userId) return;
        if (!nextMap[userId]) {
          deletes.push(userId);
        }
      });

      for (const change of upserts) {
        await putData(`bnet-access-roles/${change.userId}`, { role: change.role });
      }
      for (const userId of deletes) {
        await deleteData(`bnet-access-roles/${userId}`);
      }

      const normalizedAccessRoles = await fetchData('bnet-access-roles');
      const normalizedCandidates = await fetchData('bnet-access-role-candidates');
      setBnetAccessRoles(Array.isArray(normalizedAccessRoles) ? normalizedAccessRoles : []);
      setBnetAccessRoleCandidates(Array.isArray(normalizedCandidates) ? normalizedCandidates : []);
      const refreshedBaseline = {};
      (Array.isArray(normalizedAccessRoles) ? normalizedAccessRoles : []).forEach(item => {
        const id = Number(item.user_id || 0);
        if (id) {
          refreshedBaseline[id] = String(item.role || '').toLowerCase();
        }
      });
      setBnetAccessRolesBaseline(refreshedBaseline);
      setBnetAccessRolesDirty(false);
      if (!silent) alert('Battle.net access roles saved.');
    } catch (error) {
      if (!silent) alert('Failed to save Battle.net access roles.');
      throw error;
    } finally {
      setIsSavingBnetAccessRoles(false);
    }
  };

  const handleSaveAdminChanges = async ({ silent = false } = {}) => {
    if (!officerRolesDirty && !bnetAccessRolesDirty && !discordBotConfigDirty && !todoDirty) return;
    if (officerRolesDirty) await handleSaveOfficerRoles({ silent });
    if (bnetAccessRolesDirty) await handleSaveBnetAccessRoles({ silent });
    if (discordBotConfigDirty || scoringConfigDirty) await handleSaveDiscordBotConfig({ silent });
    if (todoDirty) await handleSaveTodoItems({ silent });
  };

  const hasAdminUnsavedChanges = officerRolesDirty || bnetAccessRolesDirty || discordBotConfigDirty || todoDirty;

  return {
    officerRoles,
    setOfficerRoles: setOfficerRolesData,
    officerRolesDirty,
    bnetAccessRoles,
    bnetAccessRoleCandidates,
    bnetAccessRolesDirty,
    setBnetAccessRoleForUser,
    removeBnetAccessRoleForUser,
    discordBotConfig,
    setDiscordBotConfig: setDiscordBotConfigData,
    discordRoles,
    discordBotConfigDirty,
    isSavingOfficerRoles,
    isSavingBnetAccessRoles,
    isSavingDiscordBotConfig,
    handleSaveOfficerRoles,
    handleSaveBnetAccessRoles,
    handleSaveDiscordBotConfig,
    handleSaveAdminChanges,
    hasAdminUnsavedChanges,
    todoDraftItems,
    todoFilterMine,
    todoDirty,
    setTodoFilterMine,
    handleAddTodoItem,
    handleUpdateTodoItem,
    handleRemoveTodoItem,
    handleSaveTodoItems
  };
}
