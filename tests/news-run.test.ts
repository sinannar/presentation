import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { validateNewsRun } from '../scripts/validate-news-run';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const fresh = () => JSON.parse(readFileSync('templates/news-run-state.json', 'utf8'));

test('new run and a validated completed stage can be resumed', () => {
  const root = mkdtempSync(join(tmpdir(), 'news state '));
  try {
    const state = fresh();
    assert.deepEqual(validateNewsRun(state, root), []);
    writeFileSync(join(root, 'research.md'), 'evidence');
    state.stages[0] = { name: 'research', status: 'complete', inputs: [], outputs: [{ path: 'research.md', sha256: hash('evidence') }], checks: ['metadata checked'], blockers: [], checkpoint: null };
    assert.deepEqual(validateNewsRun(state, root), []);
    writeFileSync(join(root, 'research.md'), 'changed evidence');
    assert.match(validateNewsRun(state, root).join(' '), /stale research.md/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('blocked, out-of-order and unsupported checkpoints cannot appear complete', () => {
  const state = fresh();
  state.stages[0].status = 'blocked';
  assert.match(validateNewsRun(state, process.cwd()).join(' '), /blocked stage requires/);
  state.stages[0].blockers = ['web unavailable'];
  state.stages[1].status = 'running';
  assert.match(validateNewsRun(state, process.cwd()).join(' '), /verify: earlier stage is incomplete/);
  state.stages[1] = { name: 'verify', status: 'complete', inputs: [], outputs: [], checks: [], blockers: [], checkpoint: 'a'.repeat(40) };
  const errors = validateNewsRun(state, process.cwd()).join(' ');
  assert.match(errors, /earlier stage is incomplete/);
  assert.match(errors, /completed stage needs outputs/);
  assert.match(errors, /checkpoint requires commit opt-in/);
  state.commitOptIn = true;
  assert.match(validateNewsRun(state, process.cwd()).join(' '), /requires an explicit scope/);
});

test('artifact references reject missing, outside and symlinked files', () => {
  const root = mkdtempSync(join(tmpdir(), 'news state '));
  try {
    const state = fresh();
    symlinkSync('/etc/passwd', join(root, 'link'));
    state.stages[0] = {
      name: 'research', status: 'complete', inputs: [],
      outputs: ['../outside', 'missing', 'link'].map((path) => ({ path, sha256: '0'.repeat(64) })),
      checks: ['checked'], blockers: [], checkpoint: null,
    };
    const errors = validateNewsRun(state, root).join(' ');
    assert.match(errors, /inside project/);
    assert.match(errors, /unavailable or unsafe missing/);
    assert.match(errors, /unavailable or unsafe link/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('completed run remains current until evidence changes and can be invalidated', () => {
  const root = mkdtempSync(join(tmpdir(), 'news stages '));
  try {
    const state = fresh();
    state.commitOptIn = true;
    state.commitScope = ['site'];
    let previous: { path: string; sha256: string } | undefined;
    for (const stage of state.stages) {
      const path = `${stage.name}.md`;
      const content = `result of ${stage.name}`;
      writeFileSync(join(root, path), content);
      stage.status = 'complete';
      stage.inputs = previous ? [previous] : [];
      stage.outputs = [{ path, sha256: hash(content) }];
      stage.checks = ['validated'];
      stage.checkpoint = 'a'.repeat(40);
      previous = stage.outputs[0];
    }
    assert.deepEqual(validateNewsRun(state, root), []);
    assert.deepEqual(validateNewsRun(state, root), []);
    writeFileSync(join(root, 'verify.md'), 'corrected');
    assert.match(validateNewsRun(state, root).join(' '), /stale verify.md/);
    for (const stage of state.stages.slice(1)) {
      Object.assign(stage, { status: 'pending', inputs: [], outputs: [], checks: [], blockers: [], checkpoint: null });
    }
    assert.deepEqual(validateNewsRun(state, root), []);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
