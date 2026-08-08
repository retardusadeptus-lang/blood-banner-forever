import { useEffect, useMemo, useState } from 'react';
import { fetchData } from '../services/apiService';
import { buildSpecsByName, getDisplayFromId, getSlugFromDisplay, getSpecById, sortSpecsByClass } from '../utils/specDataUtils';

export default function useSpecData({ initialSpecId, initialSpecName, onSpecSelection }) {
  const [specsFromDb, setSpecsFromDb] = useState([]);

  const specsByName = useMemo(() => buildSpecsByName(specsFromDb), [specsFromDb]);
  const specsSortedByClass = useMemo(() => sortSpecsByClass(specsFromDb), [specsFromDb]);

  useEffect(() => {
    const loadSpecs = async () => {
      try {
        const specs = await fetchData('specs');
        setSpecsFromDb(specs);
        if (specs.length > 0) {
          const fallbackSpecId = initialSpecId ?? specs[0].id;
          const fallbackSpecName = initialSpecName ?? specs[0].spec;
          if (onSpecSelection) {
            onSpecSelection({
              specId: fallbackSpecId,
              specName: fallbackSpecName
            });
          }
        }
      } catch (error) {
        console.error('Failed to load specs:', error);
      }
    };

    loadSpecs();
  }, [initialSpecId, initialSpecName, onSpecSelection]);

  return {
    specsFromDb,
    specsByName,
    specsSortedByClass,
    getSlugFromDisplay: (displayName) => getSlugFromDisplay(specsByName, displayName),
    getDisplayFromId: (specId) => getDisplayFromId(specsFromDb, specId),
    getSpecById: (specId) => getSpecById(specsFromDb, specId)
  };
}
