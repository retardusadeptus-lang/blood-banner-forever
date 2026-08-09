import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { fetchData } from '../services/apiService';
import { buildSpecsByName, getDisplayFromId, getSlugFromDisplay, getSpecById, sortSpecsByClass } from '../utils/specDataUtils';

export default function useSpecData({ initialSpecId, initialSpecName, onSpecSelection }) {
  const [specsFromDb, setSpecsFromDb] = useState([]);
  const selectInitialSpec = useEffectEvent((specs) => {
    if (specs.length === 0 || !onSpecSelection) return;
    onSpecSelection({
      specId: initialSpecId ?? specs[0].id,
      specName: initialSpecName ?? specs[0].spec
    });
  });

  const specsByName = useMemo(() => buildSpecsByName(specsFromDb), [specsFromDb]);
  const specsSortedByClass = useMemo(() => sortSpecsByClass(specsFromDb), [specsFromDb]);

  useEffect(() => {
    const loadSpecs = async () => {
      try {
        const specs = await fetchData('specs');
        setSpecsFromDb(specs);
        selectInitialSpec(specs);
      } catch (error) {
        console.error('Failed to load specs:', error);
      }
    };

    loadSpecs();
  }, []);

  return {
    specsFromDb,
    specsByName,
    specsSortedByClass,
    getSlugFromDisplay: (displayName) => getSlugFromDisplay(specsByName, displayName),
    getDisplayFromId: (specId) => getDisplayFromId(specsFromDb, specId),
    getSpecById: (specId) => getSpecById(specsFromDb, specId)
  };
}
