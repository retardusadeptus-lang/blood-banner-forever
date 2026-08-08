import { useEffect, useState } from 'react';

export default function useAdminData({
  fetchData,
  putData,
  activeTab,
  adminSubTab,
  scoringConfigDirty,
  setScoringConfigDirty,
  scoringConfig,
  refreshRosterClaims
}) {
  const [officerRoles, setOfficerRoles] = useState([]);
  const [officerRolesDirty, setOfficerRolesDirty] = useState(false);
  const [discordBotConfig, setDiscordBotConfig] = useState({
    request_roles: [],
    signup_roles: [],
    bench_roles: []
  });
  const [discordBotConfigDirty, setDiscordBotConfigDirty] = useState(false);
  const [isSavingOfficerRoles, setIsSavingOfficerRoles] = useState(false);
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
    const shouldLoadOfficerRoles = activeTab === 'officerRoles' || adminSubTab === 'officerRoles';
    if (!shouldLoadOfficerRoles || officerRolesDirty) return;
    let mounted = true;

    const loadOfficerRoles = async () => {
      if (document.hidden) return;
      try {
        const data = await fetchData('officer-roles');
        if (!mounted) return;
        setOfficerRoles(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load officer roles:', error);
      }
    };

    loadOfficerRoles();
    return () => { mounted = false; };
  }, [fetchData, activeTab, adminSubTab, officerRolesDirty]);

  useEffect(() => {
    const shouldLoadDiscordConfig = activeTab === 'discordBotConfig' || adminSubTab === 'config';
    if (!shouldLoadDiscordConfig || discordBotConfigDirty) return;
    let mounted = true;

    const loadDiscordBotConfig = async () => {
      if (document.hidden) return;
      try {
        const data = await fetchData('discord-bot-config');
        if (!mounted) return;
        setDiscordBotConfig({
          request_roles: Array.isArray(data?.request_roles) ? data.request_roles : [],
          signup_roles: Array.isArray(data?.signup_roles) ? data.signup_roles : [],
          bench_roles: Array.isArray(data?.bench_roles) ? data.bench_roles : []
        });
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

  const handleSaveAdminChanges = async ({ silent = false } = {}) => {
    if (!officerRolesDirty && !discordBotConfigDirty && !todoDirty) return;
    if (officerRolesDirty) await handleSaveOfficerRoles({ silent });
    if (discordBotConfigDirty || scoringConfigDirty) await handleSaveDiscordBotConfig({ silent });
    if (todoDirty) await handleSaveTodoItems({ silent });
  };

  const hasAdminUnsavedChanges = officerRolesDirty || discordBotConfigDirty || todoDirty;

  return {
    officerRoles,
    setOfficerRoles: setOfficerRolesData,
    officerRolesDirty,
    discordBotConfig,
    setDiscordBotConfig: setDiscordBotConfigData,
    discordBotConfigDirty,
    isSavingOfficerRoles,
    isSavingDiscordBotConfig,
    handleSaveOfficerRoles,
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
