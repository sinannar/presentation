import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { groupSceneMap, searchSceneMap, type SceneMapEntry } from '../src/lib/scene-map';

const entry = (index: number, overrides: Partial<SceneMapEntry> = {}): SceneMapEntry => ({
  id: `scene-${index}`, index, title: `Scene ${index}`, kind: 'content',
  section: '', summary: '', featured: false, steps: [], ...overrides,
});

test('grouping keeps every scene kind and original indices in first-seen section order', () => {
  const entries = [
    entry(0, { kind: 'home' }),
    entry(1, { kind: 'sections', section: 'Discover' }),
    entry(2, { kind: 'highlights', section: 'Discover', featured: true }),
    entry(8, { section: 'Build' }),
    entry(9, { section: ' Discover ' }),
    entry(10, { section: '   ' }),
  ];
  assert.deepEqual(groupSceneMap(entries).map((group) => [
    group.section, group.entries.map(({ index }) => index),
  ]), [
    ['Presentation', [0, 10]], ['Discover', [1, 2, 9]], ['Build', [8]],
  ]);
  assert.equal(entries[4].section, ' Discover ');
});

test('search combines title, section and summary with accent-insensitive AND matching', () => {
  const entries = [
    entry(4, { title: 'Café patterns', section: 'DÉSIGN', summary: 'A resilient approach' }),
    entry(7, { title: 'Design systems', summary: 'Café resources' }),
  ];
  assert.deepEqual(searchSceneMap(entries, ' CAFE \n design resilient '), [entries[0]]);
  assert.deepEqual(searchSceneMap(entries, 'systÉms'), [entries[1]]);
  assert.deepEqual(searchSceneMap(entries, 'missing café'), []);
});

test('empty queries preserve all kinds and search handles arbitrary literal input safely', () => {
  const entries = [
    entry(0, { kind: 'home', title: '<script>literal</script>' }),
    entry(1, { kind: 'sections', summary: '[x].*' }),
    entry(2, { kind: 'highlights', featured: true }),
  ];
  assert.deepEqual(searchSceneMap(entries, ' \t '), entries);
  assert.deepEqual(searchSceneMap(entries, '<script>'), [entries[0]]);
  assert.deepEqual(searchSceneMap(entries, '[x].*'), [entries[1]]);
  assert.deepEqual(groupSceneMap([]), []);
  assert.deepEqual(searchSceneMap([], 'anything'), []);
});

test('grouping filtered results does not renumber navigation targets', () => {
  const entries = [
    entry(1, { section: 'Start' }),
    entry(5, { section: 'Next', title: 'Target', steps: ['First reveal', 'Second reveal'] }),
    entry(12, { section: 'End', summary: 'target' }),
  ];
  const groups = groupSceneMap(searchSceneMap(entries, 'target'));
  assert.deepEqual(groups.map(({ entries }) => entries[0].index), [5, 12]);
  assert.deepEqual(groups[0].entries[0].steps, ['First reveal', 'Second reveal']);
});
