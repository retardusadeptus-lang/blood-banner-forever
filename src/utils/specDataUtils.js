export function buildSpecsByName(specs = []) {
  const lookup = {};
  specs.forEach((spec) => {
    if (spec?.spec) {
      lookup[spec.spec] = spec;
    }
  });
  return lookup;
}

export function sortSpecsByClass(specs = []) {
  return [...specs].sort((a, b) => {
    if (a.class !== b.class) {
      return String(a.class || '').localeCompare(String(b.class || ''));
    }
    return String(a.spec || '').localeCompare(String(b.spec || ''));
  });
}

export function getSlugFromDisplay(specsByName = {}, displayName) {
  const spec = specsByName[displayName];
  return spec ? spec.slug : null;
}

export function getDisplayFromId(specs = [], specId) {
  const spec = specs.find((entry) => entry.id === specId);
  return spec ? spec.spec : null;
}

export function getSpecById(specs = [], specId) {
  return specs.find((entry) => entry.id === specId);
}
