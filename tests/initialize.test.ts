import { strict as assert } from 'node:assert';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { initializeBrief } from '../scripts/initialize';

test('initialization creates a brief without overwriting existing work', () => {
  const root = mkdtempSync(join(tmpdir(), 'presentation-init-'));
  try {
    mkdirSync(join(root, 'templates'));
    mkdirSync(join(root, 'authoring'));
    writeFileSync(join(root, 'authoring/brief.md'), 'Old work');
    writeFileSync(join(root, 'templates/brief.md'), '# Brief\n');
    assert.equal(initializeBrief(root), 'created');
    writeFileSync(join(root, 'sources/workflows/brief.md'), 'My own brief');
    assert.equal(initializeBrief(root), 'exists');
    assert.equal(readFileSync(join(root, 'sources/workflows/brief.md'), 'utf8'), 'My own brief');
    assert.equal(readFileSync(join(root, 'authoring/brief.md'), 'utf8'), 'Old work');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
