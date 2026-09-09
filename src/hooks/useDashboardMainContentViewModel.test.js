import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('dashboard content view model memo dependencies include projected callback props', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/hooks/useDashboardMainContentViewModel.js'), 'utf8');
  const dependencyBlock = source.slice(source.lastIndexOf('  }), ['));

  for (const callback of [
    'activeSiteTabId',
    'canViewScoring',
    'setPriorityPhase',
    'handleMoveEnabledBoss',
    'setRaidAssignmentData',
  ]) {
    assert.match(dependencyBlock, new RegExp(`props\\.${callback}\\b`));
  }
});