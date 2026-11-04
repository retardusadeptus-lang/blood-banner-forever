import { useEffect, useRef, useState } from 'react';

export function useItemsDatabase({
  fetchData,
  putData,
  postData,
  deleteData,
  phaseJsonKeys,
  leftSlots,
  p2Bosses,
  globalPhase,
  defaultPhase = globalPhase,
  setSelectedItemName,
}) {
  const [mutableItems, setMutableItemsLocal] = useState([]);
  const [mutableItemsBaseline, setMutableItemsBaseline] = useState([]);
  const [bisPriorities, setBisPrioritiesLocal] = useState({});
  const [dbBisPriorities, setDbBisPrioritiesLocal] = useState({});
  const [dbBisPrioritiesBaseline, setDbBisPrioritiesBaseline] = useState({});
  const [masterItemsDbPhase, setMasterItemsDbPhaseLocal] = useState(defaultPhase);
  const masterItemsDbPhaseWasSelected = useRef(false);
  const [dbNewName, setDbNewName] = useState('');
  const [dbNewSlot, setDbNewSlot] = useState(leftSlots[0]);
  const [dbNewZone, setDbNewZone] = useState('');
  const [dbNewBoss, setDbNewBoss] = useState('');
  const [dbNewItemId, setDbNewItemId] = useState('');
  const [dbSearch, setDbSearchLocal] = useState('');
  const [dbPageSize, setDbPageSize] = useState(25);
  const [dbPage, setDbPage] = useState(1);
  const [showMissingWowheadFilter, setShowMissingWowheadFilterLocal] = useState(false);
  const [showWowheadNameMismatchFilter, setShowWowheadNameMismatchFilterLocal] = useState(false);
  const [dbBisPrioritiesDirty, setDbBisPrioritiesDirty] = useState(false);
  const [mutableItemsDirty, setMutableItemsDirty] = useState(false);
  const [isSavingItemsDb, setIsSavingItemsDb] = useState(false);

  const setDbSearch = (value) => {
    setDbSearchLocal(value);
    setDbPage(1);
  };

  const setShowMissingWowheadFilter = (value) => {
    setShowMissingWowheadFilterLocal(value);
    setDbPage(1);
  };

  const setShowWowheadNameMismatchFilter = (value) => {
    setShowWowheadNameMismatchFilterLocal(value);
    setDbPage(1);
  };

  const setMasterItemsDbPhase = (value) => {
    masterItemsDbPhaseWasSelected.current = true;
    setMasterItemsDbPhaseLocal(value);
    setDbPage(1);
  };

  useEffect(() => {
    if (!masterItemsDbPhaseWasSelected.current && defaultPhase) {
      setMasterItemsDbPhaseLocal(defaultPhase);
    }
  }, [defaultPhase]);

  const setBisPriorities = (newVal) => {
    setBisPrioritiesLocal(newVal);
    const phaseKey = phaseJsonKeys[globalPhase];
    const previous = bisPriorities;
    const updates = {};
    const deletes = [];

    Object.keys(newVal).forEach((key) => {
      if (previous[key] !== newVal[key]) {
        updates[key] = newVal[key];
      }
    });

    Object.keys(previous).forEach((key) => {
      if (!(key in newVal)) {
        deletes.push(key);
      }
    });

    if (Object.keys(updates).length || deletes.length) {
      putData('bis-priorities/' + phaseKey, { updates, deletes });
    }
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
      alert(`Successfully added "${newItem?.name || dbNewName.trim()}" to items table!`);
    } catch (error) {
      const message = error?.payload?.error || error?.message || 'Failed to add item.';
      alert(message);
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
    } catch {
      alert('Failed to delete item.');
    }
  };

  const handleSaveItemsDbChanges = async () => {
    if (!dbBisPrioritiesDirty && !mutableItemsDirty) return;
    setIsSavingItemsDb(true);
    try {
      if (dbBisPrioritiesDirty) {
        const phaseKey = phaseJsonKeys[masterItemsDbPhase];
        const updates = {};
        const deletes = [];

        Object.keys(dbBisPriorities).forEach((key) => {
          if (dbBisPrioritiesBaseline[key] !== dbBisPriorities[key]) {
            updates[key] = dbBisPriorities[key];
          }
        });

        Object.keys(dbBisPrioritiesBaseline).forEach((key) => {
          if (!(key in dbBisPriorities)) {
            deletes.push(key);
          }
        });

        await putData('bis-priorities/' + phaseKey, { updates, deletes });
        setDbBisPrioritiesBaseline(dbBisPriorities);
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
    } catch {
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
    dbBisPrioritiesBaseline,
    setDbBisPrioritiesBaseline,
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