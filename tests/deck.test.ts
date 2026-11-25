import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { selectDeck, type DeckEntry } from '../src/lib/deck';

const entries = [
  { reference: 'docs/first', section: 'Guides', draft: false, featured: true },
  { reference: 'docs/draft', section: 'Guides', draft: true, featured: true },
  { reference: 'docs/last', section: 'Guides', draft: false, featured: false },
  { reference: 'news/update', section: 'Updates', draft: false, featured: true },
] satisfies (DeckEntry & { featured: boolean })[];

test('absent selection keeps all published entries in input order', () => {
  assert.deepEqual(selectDeck(entries).map(({ reference }) => reference), [
    'docs/first', 'docs/last', 'news/update',
  ]);
});

test('an explicit empty selection produces an empty deck', () => {
  assert.deepEqual(selectDeck(entries, { sections: [] }), []);
});

test('explicit sections and highlights follow selection order, not source categories', () => {
  const result = selectDeck(entries, { sections: [
    { name: 'Opening', items: ['news/update', 'docs/last'] },
    { name: 'Closing', items: ['docs/first'] },
  ] });
  assert.deepEqual(result.map(({ reference, section }) => [reference, section]), [
    ['news/update', 'Opening'], ['docs/last', 'Opening'], ['docs/first', 'Closing'],
  ]);
  assert.deepEqual(result.filter(({ featured }) => featured).map(({ reference }) => reference), [
    'news/update', 'docs/first',
  ]);
  assert.equal(entries[3].section, 'Updates');
});

test('duplicate sections and references are rejected, including draft references', () => {
  assert.throws(() => selectDeck(entries, { sections: [
    { name: 'Same', items: [] }, { name: ' Same ', items: [] },
  ] }), /Duplicate presentation section: Same/);
  assert.throws(() => selectDeck(entries, { sections: [
    { name: 'One', items: ['docs/draft'] }, { name: 'Two', items: ['docs/draft'] },
  ] }), /Duplicate presentation reference: docs\/draft/);
});

test('unknown references are rejected, even after a valid draft', () => {
  assert.throws(() => selectDeck(entries, { sections: [
    { name: 'Section', items: ['docs/draft', 'news/missing'] },
  ] }), /Unknown presentation reference: news\/missing/);
});

test('draft references validate but are omitted, including from featured results', () => {
  const result = selectDeck(entries, { sections: [
    { name: 'Draft only', items: ['docs/draft'] },
    { name: 'Published', items: ['docs/first'] },
  ] });
  assert.deepEqual(result.map(({ reference, section }) => [reference, section]), [
    ['docs/first', 'Published'],
  ]);
  assert.deepEqual(result.filter(({ featured }) => featured).map(({ reference }) => reference), ['docs/first']);
});

test('blank section names are rejected', () => {
  assert.throws(() => selectDeck(entries, { sections: [{ name: '  ', items: [] }] }), /must not be empty/);
});
