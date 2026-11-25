import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { keynoteShortcut } from '../src/lib/keynote-shortcuts';

const idle = { dialogOpen: false, modified: false, editing: false, interactive: false };

test('keynote shortcuts navigate and open help in the normal presentation', () => {
  assert.equal(keynoteShortcut('ArrowRight', idle), 'next');
  assert.equal(keynoteShortcut(' ', idle), 'next');
  assert.equal(keynoteShortcut('ArrowLeft', idle), 'previous');
  assert.equal(keynoteShortcut('PageDown', idle), 'next');
  assert.equal(keynoteShortcut('PageUp', idle), 'previous');
  assert.equal(keynoteShortcut('Home', idle), 'home');
  assert.equal(keynoteShortcut('?', idle), 'help');
  assert.equal(keynoteShortcut('f', idle), 'fullscreen');
  assert.equal(keynoteShortcut('F', idle), 'fullscreen');
  assert.equal(keynoteShortcut('r', idle), 'remote');
  assert.equal(keynoteShortcut('R', idle), 'remote');
  assert.equal(keynoteShortcut('g', idle), 'map');
  assert.equal(keynoteShortcut('G', idle), 'map');
  assert.equal(keynoteShortcut('m', idle), 'map');
  assert.equal(keynoteShortcut('M', idle), 'map');
  assert.equal(keynoteShortcut('p', idle), 'presenter');
  assert.equal(keynoteShortcut('n', idle), 'notes');
  assert.equal(keynoteShortcut('e', idle), 'details');
  assert.equal(keynoteShortcut('t', idle), 'highlights');
  assert.equal(keynoteShortcut('h', idle), 'hide-controls');
  assert.equal(keynoteShortcut('b', idle), 'blackout');
  assert.equal(keynoteShortcut('s', idle), 'skip-reveals');
  assert.equal(keynoteShortcut('2', idle), 'section');
  assert.equal(keynoteShortcut('ArrowRight', { ...idle, shift: true }), 'next-scene');
  assert.equal(keynoteShortcut('ArrowLeft', { ...idle, shift: true }), 'previous-scene');
});

test('shortcuts respect dialogs, editing, modifiers and native button activation', () => {
  assert.equal(keynoteShortcut('?', { ...idle, dialogOpen: true }), undefined);
  assert.equal(keynoteShortcut('f', { ...idle, editing: true }), undefined);
  assert.equal(keynoteShortcut('r', { ...idle, dialogOpen: true }), undefined);
  assert.equal(keynoteShortcut('r', { ...idle, editing: true }), undefined);
  assert.equal(keynoteShortcut('m', { ...idle, editing: true }), undefined);
  assert.equal(keynoteShortcut('ArrowRight', { ...idle, modified: true }), undefined);
  assert.equal(keynoteShortcut(' ', { ...idle, interactive: true }), undefined);
  assert.equal(keynoteShortcut('?', { ...idle, interactive: true }), 'help');
  assert.equal(keynoteShortcut('ArrowRight', { ...idle, interactive: true }), 'next');
});
