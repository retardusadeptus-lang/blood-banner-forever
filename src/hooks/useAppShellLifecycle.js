import { useEffect } from 'react';
import { STORAGE_KEYS } from '../constants';

export default function useAppShellLifecycle({ activeTab, hasAnyUnsavedChanges }) {
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activeTab, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!hasAnyUnsavedChanges) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasAnyUnsavedChanges]);
}
