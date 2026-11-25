import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { Window, type HTMLInputElement } from 'happy-dom';
import { groupSceneMap, readSceneMapVisibility, searchSceneMap, writeSceneMapVisibility, type SceneMapEntry } from '../src/lib/scene-map';
import { installSceneMap } from '../src/scripts/scene-map';

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

test('visibility storage tolerates corrupt, malformed and inaccessible values', () => {
  const storage = {
    getItem: () => '{"scenes":["one",5],"sections":null}',
    setItem: () => { throw new Error('quota'); },
  } as unknown as Storage;
  const state = readSceneMapVisibility(storage, 'key');
  assert.deepEqual([...state.scenes], ['one']);
  assert.deepEqual([...state.sections], []);
  assert.doesNotThrow(() => writeSceneMapVisibility(storage, 'key', state));
  assert.deepEqual([...state.scenes], ['one']);
  assert.equal(readSceneMapVisibility({ getItem: () => { throw new Error('denied'); } } as unknown as Storage, 'key').scenes.size, 0);
  assert.equal(readSceneMapVisibility({ getItem: () => '{' } as unknown as Storage, 'key').sections.size, 0);
});

test('map hiding is reversible, persisted, and leaves presentation navigation intact', async () => {
  const window = new Window({ url: 'https://example.test/talk/' });
  const names = ['window', 'document', 'HTMLElement'] as const;
  const originals = names.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
  names.forEach((name) => Object.defineProperty(globalThis, name, { value: window[name], configurable: true, writable: true }));
  const document = window.document;
  document.body.innerHTML = `
    <button id="open">Open</button>
    <section data-scene="home" data-kind="home"><h1>Welcome</h1></section>
    <section data-scene="one" data-section="First"><h2>One</h2><p data-reveal>Detail</p></section>
    <section data-scene="two" data-section="First"><h2>Two</h2></section>
    <section data-scene="three" data-section="Second"><h2>Three</h2></section>`;
  const scenes = [...document.querySelectorAll('[data-scene]')] as unknown as HTMLElement[];
  const jumps: number[][] = [];
  const install = () => installSceneMap({ scenes, getIndex: () => 1, jump: (index, step = 0) => jumps.push([index, step]) });
  const button = (selector: string) => document.querySelector(selector) as unknown as HTMLButtonElement;
  const click = (selector: string) => { const target = button(selector); assert.ok(target, selector); target.click(); };
  let map = install();
  try {
    button('#open').focus();
    map.open();
    assert.equal(document.querySelectorAll('.scene-map__quick-card').length, 1);
    assert.equal(document.querySelector('.scene-map__item--current .scene-map__destination')?.getAttribute('aria-current'), 'location');
    click('[aria-label="Hide One from map"]');
    assert.equal(document.querySelector('.scene-map__item .scene-map__destination[data-scene-id="one"]'), null);
    assert.ok(document.querySelector('[data-scene="one"]'));
    assert.equal(document.activeElement, document.querySelector('.scene-map__visibility-toggle'));
    click('.scene-map__visibility-toggle');
    assert.ok(button('[aria-label="Restore One in map"]'));
    assert.equal(button('.scene-map__item .scene-map__destination[data-scene-id="one"]').disabled, true);
    click('[aria-label="Restore One in map"]');
    click('[aria-label="Hide Two from map"]');
    click('[aria-label="Hide section First from map"]');
    assert.equal(button('[aria-label="One is hidden by section; restore the section first"]').disabled, true);
    map.dispose();

    map = install();
    map.open();
    assert.equal(document.querySelector('.scene-map__item .scene-map__destination[data-scene-id="two"]'), null);
    click('.scene-map__visibility-toggle');
    click('[aria-label="Restore section First in map"]');
    assert.equal(button('.scene-map__item .scene-map__destination[data-scene-id="two"]').disabled, true);
    click('[aria-label="Restore Two in map"]');
    const reveal = document.querySelector('.scene-map__steps') as unknown as HTMLDetailsElement;
    reveal.open = true;
    click('.scene-map__step');
    assert.deepEqual(jumps, [[1, 1]]);
    assert.equal(map.isOpen(), false);
    assert.equal(document.activeElement?.id, 'open');

    map.open();
    click('[aria-label="Hide Three from map"]');
    click('.scene-map__restore-all');
    assert.ok(button('.scene-map__item .scene-map__destination[data-scene-id="three"]'));
    const search = document.querySelector('.scene-map__search') as unknown as HTMLInputElement;
    search.value = 'three';
    search.dispatchEvent(new window.Event('input', { bubbles: true }));
    search.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    assert.deepEqual(jumps.at(-1), [3, 0]);
  } finally {
    map.dispose();
    await window.happyDOM.abort();
    names.forEach((name, index) => {
      if (originals[index]) Object.defineProperty(globalThis, name, originals[index]!);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
});
