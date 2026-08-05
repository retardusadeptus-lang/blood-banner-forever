import { useEffect, useState } from 'react';

export function useItemsDatabase({
  fetchData,
  putData,
  postData,
  deleteData,
  phaseJsonKeys,
  leftSlots,
  p2Bosses,
  globalPhase,
  setSelectedItemName,
}) {
  const [mutableItems, setMutableItemsLocal] = useState([]);
  const [mutableItemsBaseline, setMutableItemsBaseline] = useState([]);
  const [bisPriorities, setBisPrioritiesLocal] = useState({});
  const [dbBisPriorities, setDbBisPrioritiesLocal] = useState({});
  const [masterItemsDbPhase, setMasterItemsDbPhase] = useState('T5');
  const [dbNewName, setDbNewName] = useState('');
  const [dbNewSlot, setDbNewSlot] = useState(leftSlots[0]);
  const [dbNewZone, setDbNewZone] = useState('SSC');
  const [dbNewBoss, setDbNewBoss] = useState(p2Bosses[0]);
  const [dbNewItemId, setDbNewItemId] = useState('');
  const [dbSearch, setDbSearch] = useState('');
  const [dbPageSize, setDbPageSize] = useState(25);
  const [dbPage, setDbPage] = useState(1);
  const [showMissingWowheadFilter, setShowMissingWowheadFilter] = useState(false);
  const [showWowheadNameMismatchFilter, setShowWowheadNameMismatchFilter] = useState(false);
  const [dbBisPrioritiesDirty, setDbBisPrioritiesDirty] = useState(false);
  const [mutableItemsDirty, setMutableItemsDirty] = useState(false);
  const [isSavingItemsDb, setIsSavingItemsDb] = useState(false);

  useEffect(() => {
    setDbPage(1);
  }, [dbSearch, showMissingWowheadFilter, showWowheadNameMismatchFilter, masterItemsDbPhase]);

  const setBisPriorities = (newVal) => {
    setBisPrioritiesLocal(newVal);
    const phaseKey = phaseJsonKeys[globalPhase];
    putData('bis-priorities/' + phaseKey, newVal);
  };

  const setDbBisPriorities = (newVal) => {
    setDbBisPrioritiesLocal(newVal);
    setDbBisPrioritiesDirty(true);
  };

  const handleAddItemToDb = async (e) => {
    e.preventDefault();
    if (!dbNewName.trim()) return;

    if (mutableItems.some(i => i.name.toLowerCase() === dbNewName.trim().toLowerCase())) {
      alert('An item with that name already exists in the database!');
      return;
    }

    try {
      const newItem = await postData('items', {
        name: dbNewName.trim(),
        slot: dbNewSlot,
        source: dbNewZone,
        source_type: dbNewBoss,
        zone: dbNewZone,
        boss: dbNewBoss,
        itemId: dbNewItemId.trim()
      });
      const updatedItems = [newItem, ...mutableItems];
      setMutableItemsLocal(updatedItems);
      setMutableItemsBaseline(updatedItems);
      setMutableItemsDirty(false);
      setDbNewName('');
      setDbNewItemId('');
      alert(`Successfully added "${newItem.name}" to items table!`);
    } catch (err) {
      alert('Failed to add item.');
    }
  };

  const handleUpdateItemEligibility = (itemName, spec, currentStatus, useDbPhase = false) => {
    const itemKey = `${itemName}|${spec}`;
    let nextStatus = '';
    if (currentStatus === '') nextStatus = 'BiS';
    else if (currentStatus === 'BiS') nextStatus = 'Opt';

    const currentBis = useDbPhase ? dbBisPriorities : bisPriorities;
    const newBisPriorities = { ...currentBis };
    if (nextStatus) newBisPriorities[itemKey] = nextStatus;
    else delete newBisPriorities[itemKey];

    if (useDbPhase) setDbBisPriorities(newBisPriorities);
    else setBisPriorities(newBisPriorities);
  };

  const handleUpdateItemId = (id, newId) => {
    setMutableItemsLocal(mutableItems.map(item => (item.id === id ? { ...item, itemId: newId } : item)));
    setMutableItemsDirty(true);
  };

  const handleUpdateItemSource = (id, field, value) => {
    setMutableItemsLocal(mutableItems.map(item => {
      if (item.id !== id) return item;

      const nextItem = { ...item, [field]: value };
      const sourceDetails = {
        source: field === 'source' ? value : (item.source ?? ''),
        source_type: field === 'source_type' ? value : (item.source_type ?? ''),
      };

      return {
        ...nextItem,
        source: sourceDetails.source,
        source_type: sourceDetails.source_type,
        zone: sourceDetails.source || (field === 'source' ? value : item.zone || ''),
        boss: sourceDetails.source_type || (field === 'source_type' ? value : item.boss || ''),
      };
    }));
    setMutableItemsDirty(true);
  };

  const handleDeleteItemFromDb = async (id, itemName) => {
    if (!window.confirm(`Permanently remove "${itemName}" from the master loot tables?`)) return;

    try {
      await deleteData(`items/${id}`);
      const updatedItems = mutableItems.filter(i => i.id !== id);
      setMutableItemsLocal(updatedItems);
      setMutableItemsBaseline(updatedItems);
      setMutableItemsDirty(false);
      if (setSelectedItemName) setSelectedItemName('');
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  const handleSaveItemsDbChanges = async () => {
    if (!dbBisPrioritiesDirty && !mutableItemsDirty) return;
    setIsSavingItemsDb(true);
    try {
      if (dbBisPrioritiesDirty) {
        const phaseKey = phaseJsonKeys[masterItemsDbPhase];
        await putData('bis-priorities/' + phaseKey, dbBisPriorities);
      }

      if (mutableItemsDirty) {
        const baselineById = new Map(mutableItemsBaseline.map(item => [item.id, item]));
        const changedItems = mutableItems.filter(item => {
          const baselineItem = baselineById.get(item.id);
          if (!baselineItem) return false;

          return (
            String(baselineItem.itemId || '') !== String(item.itemId || '') ||
            String(baselineItem.source || '') !== String(item.source || '') ||
            String(baselineItem.source_type || '') !== String(item.source_type || '')
          );
        });

        await Promise.all(changedItems.map(item => putData(`items/${item.id}`, {
          itemId: item.itemId || '',
          source: item.source || '',
          source_type: item.source_type || '',
        })));
      }

      const refreshedItems = await fetchData('mutable-items');
      setMutableItemsLocal(refreshedItems);
      setMutableItemsBaseline(refreshedItems);
      setDbBisPrioritiesDirty(false);
      setMutableItemsDirty(false);
      alert('Master items changes saved.');
    } catch (err) {
      alert('Failed to save master items changes.');
    } finally {
      setIsSavingItemsDb(false);
    }
  };

  return {
    mutableItems,
    setMutableItemsLocal,
    mutableItemsBaseline,
    setMutableItemsBaseline,
    bisPriorities,
    setBisPrioritiesLocal,
    dbBisPriorities,
    setDbBisPrioritiesLocal,
    masterItemsDbPhase,
    setMasterItemsDbPhase,
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
    dbBisPrioritiesDirty,
    setDbBisPrioritiesDirty,
    mutableItemsDirty,
    setMutableItemsDirty,
    isSavingItemsDb,
    setIsSavingItemsDb,
    handleAddItemToDb,
    handleUpdateItemEligibility,
    handleUpdateItemId,
    handleUpdateItemSource,
    handleDeleteItemFromDb,
    handleSaveItemsDbChanges,
  };
}