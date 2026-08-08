export function ensureBossPhaseCollection(bossData) {
  if (!bossData || typeof bossData !== 'object') {
    return [];
  }

  if (!Array.isArray(bossData.phases)) {
    bossData.phases = [];
  }

  return bossData.phases;
}

export function getOrCreatePhase(bossData, phaseId, generateId = () => Math.random().toString(36).substr(2, 9)) {
  const phases = ensureBossPhaseCollection(bossData);
  const existingPhase = phases.find(phase => phase && phase.id === phaseId);

  if (existingPhase) {
    return existingPhase;
  }

  const createdPhase = {
    id: phaseId || generateId(),
    name: `Phase ${phases.length + 1}`,
    enabledBlocks: ['tanks', 'healers'],
    tankAssignments: [],
    healerAssignments: []
  };

  phases.push(createdPhase);
  return createdPhase;
}

export function normalizeBossState(bossData, generateId) {
  if (!bossData || typeof bossData !== 'object') {
    return {
      targets: [],
      phases: [],
      hunterMDs: {},
      judgements: {},
      fearWards: [],
      imageUrl: '',
      bloodlustAt: ''
    };
  }

  const normalized = { ...bossData };
  normalized.targets = Array.isArray(bossData.targets) ? bossData.targets : [];
  normalized.phases = Array.isArray(bossData.phases)
    ? bossData.phases.filter(Boolean).map(phase => ({
        ...phase,
        enabledBlocks: Array.isArray(phase?.enabledBlocks) ? phase.enabledBlocks.filter(Boolean) : ['tanks', 'healers'],
        tankAssignments: Array.isArray(phase?.tankAssignments) ? phase.tankAssignments : [],
        healerAssignments: Array.isArray(phase?.healerAssignments) ? phase.healerAssignments : []
      }))
    : [];
  normalized.hunterMDs = bossData.hunterMDs && typeof bossData.hunterMDs === 'object' ? bossData.hunterMDs : {};
  normalized.judgements = bossData.judgements && typeof bossData.judgements === 'object' ? bossData.judgements : {};
  normalized.fearWards = Array.isArray(bossData.fearWards) ? bossData.fearWards : [];
  normalized.imageUrl = typeof bossData.imageUrl === 'string' ? bossData.imageUrl : '';
  normalized.bloodlustAt = typeof bossData.bloodlustAt === 'string' ? bossData.bloodlustAt : '';

  if (normalized.phases.length === 0) {
    normalized.phases.push(getOrCreatePhase(normalized, null, generateId));
  }

  return normalized;
}
