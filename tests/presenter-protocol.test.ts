import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { isPresenterCommand, isPresenterState, isRoom, presenterKeyAction, presenterStorageKey, previewUrl, type PresenterState } from '../src/lib/presenter-protocol';

const state: PresenterState = {
  id: 'scene / one', index: 1, count: 3, title: 'Title', summary: 'Summary', section: 'Section', step: 1, steps: 2,
  nextTitle: 'Next', nextId: 'scene / one', nextStep: 2,
  scenes: [{ id: 'start', index: 0, title: 'Start', section: '' }, { id: 'scene / one', index: 1, title: 'Title', section: 'Section' }, { id: 'end', index: 2, title: 'End', section: '' }],
  notes: { talkingPoints: ['A'], technicalDetails: [], transition: 'Onward' },
};
test('validates state, note structure, and scene/step bounds', () => {
  assert.equal(isPresenterState(state), true);
  assert.equal(isPresenterState({ ...state, index: 3 }), false);
  assert.equal(isPresenterState({ ...state, step: 3 }), false);
  assert.equal(isPresenterState({ ...state, step: 1.5 }), false);
  assert.equal(isPresenterState({ ...state, notes: { ...state.notes, talkingPoints: [42] } }), false);
  assert.equal(isPresenterState({ ...state, nextId: 'unknown' }), false);
  assert.equal(isPresenterState({ ...state, nextStep: 3 }), false);
  assert.equal(isPresenterState({ ...state, nextId: '', nextStep: 0 }), true);
  assert.equal(isPresenterState({ ...state, nextId: '', nextStep: 1 }), false);
  assert.equal(isPresenterState({ ...state, scenes: state.scenes.slice(0, 2) }), false);
  assert.equal(isPresenterState({ ...state, scenes: [state.scenes[0], state.scenes[0], state.scenes[2]] }), false);
  assert.equal(isPresenterState(null), false);
});
test('rejects malformed or out-of-range commands', () => {
  assert.equal(isPresenterCommand({ type: 'next' }, state), true);
  assert.equal(isPresenterCommand({ type: 'next', index: 2 }, state), false);
  assert.equal(isPresenterCommand({ type: 'goto', index: 2 }, state), true);
  assert.equal(isPresenterCommand({ type: 'goto', index: 1, step: 2 }, state), true);
  assert.equal(isPresenterCommand({ type: 'goto', index: 1, step: 3 }, state), false);
  assert.equal(isPresenterCommand({ type: 'goto', index: 2, step: 1 }, state), false);
  assert.equal(isPresenterCommand({ type: 'goto', index: -1 }, state), false);
  assert.equal(isPresenterCommand({ type: 'goto', index: 3 }, state), false);
  assert.equal(isPresenterCommand({ type: 'goto', index: 1.2 }, state), false);
});
test('preview links stay on the original same-origin pathname', () => {
  assert.equal(previewUrl('/base/', 'scene / one', 2, 'https://example.test'), 'https://example.test/base/?preview=1&step=2#scene%20%2F%20one');
  for (const path of ['//evil.test/', '/\\evil.test/', '/base/?bad=1', '/base/#bad', 'https://evil.test/']) assert.equal(previewUrl(path, 'scene', 0, 'https://example.test'), null);
  assert.equal(previewUrl('/base/', 'scene', -1, 'https://example.test'), null);
  assert.equal(isRoom('a'.repeat(32)), true);
  assert.equal(isRoom('g'.repeat(32)), false);
});
test('presenter details are scoped to the normalized site base path', () => {
  assert.equal(presenterStorageKey('/talk/'), presenterStorageKey('/talk'));
  assert.notEqual(presenterStorageKey('/talk/'), presenterStorageKey('/other/'));
  assert.notEqual(presenterStorageKey('/talk/'), presenterStorageKey('/'));
});
test('presenter shortcuts preserve text editing and native button activation', () => {
  const idle = { editing: false, interactive: false, modified: false };
  assert.equal(presenterKeyAction('ArrowRight', idle), 'next');
  assert.equal(presenterKeyAction(' ', idle), 'next');
  assert.equal(presenterKeyAction('ArrowLeft', idle), 'previous');
  assert.equal(presenterKeyAction('Home', idle), 'home');
  assert.equal(presenterKeyAction('G', idle), 'map');
  assert.equal(presenterKeyAction('n', idle), 'notes');
  assert.equal(presenterKeyAction(' ', { ...idle, interactive: true }), undefined);
  assert.equal(presenterKeyAction('n', { ...idle, editing: true }), undefined);
  assert.equal(presenterKeyAction('Home', { ...idle, modified: true }), undefined);
});
