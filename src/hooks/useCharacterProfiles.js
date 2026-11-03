import { useCallback, useEffect, useState } from 'react';

export default function useCharacterProfiles({ fetchData, postData, putData, deleteData, isAuthenticated }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshProfiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchData('profiles');
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load character profiles.');
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    let cancelled = false;

    const loadProfiles = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchData('profiles');
        if (!cancelled) setProfiles(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load character profiles.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfiles();
    return () => {
      cancelled = true;
    };
  }, [fetchData, isAuthenticated]);

  const createProfile = useCallback(async (profile) => {
    const created = await postData('profiles', profile);
    setProfiles(current => [created, ...current]);
    return created;
  }, [postData]);

  const updateProfile = useCallback(async (profileId, profile) => {
    const updated = await putData(`profiles/${profileId}`, profile);
    setProfiles(current => current.map(profileEntry => profileEntry.id === updated.id ? updated : profileEntry));
    return updated;
  }, [putData]);

  const deleteProfile = useCallback(async (profileId) => {
    await deleteData(`profiles/${profileId}`);
    setProfiles(current => current.filter(profileEntry => profileEntry.id !== profileId));
  }, [deleteData]);

  return {
    profiles,
    profilesLoading: loading,
    profilesError: error,
    refreshProfiles,
    createProfile,
    updateProfile,
    deleteProfile
  };
}
