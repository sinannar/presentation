import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkSourceRefs, inventorySources, sourceRef } from '../scripts/source-inventory';
import { checkContentRefs } from '../scripts/validate-content';

function fixture(t: { after: (fn: () => void) => void }): string {
  const root = join(process.cwd(), 'tests', `.source-fixture-${process.pid}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(root, { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('inventories nested duplicate names with file-qualified references and byte hashes without modifying notes', (t) => {
  const root = fixture(t);
  mkdirSync(join(root, 'sources', 'one space'), { recursive: true });
  mkdirSync(join(root, 'sources', 'other'), { recursive: true });
  const first = join(root, 'sources', 'one space', 'note.md');
  const bytes = Buffer.from('First\r\nSecond\r\n', 'utf8');
  writeFileSync(first, bytes);
  writeFileSync(join(root, 'sources', 'other', 'note.md'), 'Different\n');
  const result = inventorySources(root, 'sources');
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.files.map((file) => file.path), ['sources/one space/note.md', 'sources/other/note.md']);
  assert.equal(result.files[0].lines, 2);
  assert.equal(sourceRef(result.files[0]), `sources/one space/note.md#L1-L2@sha256:${createHash('sha256').update(bytes).digest('hex')}`);
  assert.deepEqual(readFileSync(first), bytes);
  assert.deepEqual(checkSourceRefs([sourceRef(result.files[0]), sourceRef(result.files[1])], result.files), []);
  assert.equal(inventorySources(root, 'sources').files[0].sha256, result.files[0].sha256);
});

test('rejects unsupported, invalid UTF-8, binary and symlink inputs without reading their content', (t) => {
  const root = fixture(t);
  mkdirSync(join(root, 'sources'));
  writeFileSync(join(root, 'sources', 'invalid.txt'), Buffer.from([0xc3, 0x28]));
  writeFileSync(join(root, 'sources', 'binary.md'), Buffer.from([65, 0, 66]));
  writeFileSync(join(root, 'sources', 'other.pdf'), 'private contents');
  writeFileSync(join(root, 'sources', '.gitkeep'), '');
  symlinkSync('other.pdf', join(root, 'sources', 'link.txt'));
  const { files, errors } = inventorySources(root, 'sources');
  assert.equal(files.length, 0);
  assert.equal(errors.length, 4);
  assert.match(errors.join('\n'), /invalid UTF-8/);
  assert.match(errors.join('\n'), /binary/);
  assert.match(errors.join('\n'), /unsupported file/);
  assert.match(errors.join('\n'), /symlink/);
  assert.doesNotMatch(errors.join('\n'), /private contents/);
  assert.match(inventorySources(root, '..').errors[0], /inside the project/);
});

test('optional content evidence check catches missing, stale and invalid ranges', (t) => {
  const root = fixture(t);
  mkdirSync(join(root, 'sources'), { recursive: true });
  mkdirSync(join(root, 'src', 'content', 'docs'), { recursive: true });
  mkdirSync(join(root, 'src', 'content', 'news'), { recursive: true });
  writeFileSync(join(root, 'sources', 'note.txt'), 'one\ntwo\n');
  const initial = inventorySources(root, 'sources').files;
  const ref = sourceRef(initial[0]);
  const content = join(root, 'src', 'content', 'docs', 'test.md');
  writeFileSync(content, `---\ntitle: Test\nsourceRefs: ["${ref}"]\n---\nBody\n`);
  assert.deepEqual(checkContentRefs(root, initial), []);
  assert.match(checkSourceRefs([ref.replace('#L1-L2', '#L2-L3')], initial)[0], /out of bounds/);
  assert.match(checkSourceRefs([ref.replace('note.txt', 'missing.txt')], initial)[0], /not found/);
  assert.match(checkSourceRefs(['note.txt#L1-L2'], initial)[0], /invalid source reference/);
  writeFileSync(join(root, 'sources', 'note.txt'), 'changed\ntwo\n');
  assert.match(checkContentRefs(root, inventorySources(root, 'sources').files)[0], /stale/);
  assert.match(checkContentRefs(root, [])[0], /not found/);
});

test('default source inventory excludes workflow metadata and candidate assets', (t) => {
  const root = fixture(t);
  mkdirSync(join(root, 'sources', 'workflows', 'topic'), { recursive: true });
  mkdirSync(join(root, 'sources', 'private', 'assets'), { recursive: true });
  mkdirSync(join(root, 'sources', 'private', 'workflows'), { recursive: true });
  mkdirSync(join(root, 'sources', 'news', 'topic'), { recursive: true });
  writeFileSync(join(root, 'sources', 'news', 'topic', 'record.md'), 'Evidence\n');
  writeFileSync(join(root, 'sources', 'workflows', 'topic', 'state.json'), '{}');
  writeFileSync(join(root, 'sources', 'workflows', 'topic', 'outline.md'), 'Derived outline\n');
  writeFileSync(join(root, 'sources', 'private', 'assets', 'candidate.png'), 'image');
  writeFileSync(join(root, 'sources', 'private', 'workflows', 'state.json'), '{}');
  const result = inventorySources(root, 'sources');
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.files.map((file) => file.path), ['sources/news/topic/record.md']);
  assert.match(inventorySources(root, 'sources/workflows').errors.join(' '), /unsupported file/);
});

test('only generated artifact directories are trackable by default', (t) => {
  const root = fixture(t);
  assert.equal(spawnSync('git', ['init', '-q', root]).status, 0);
  copyFileSync(join(process.cwd(), '.gitignore'), join(root, '.gitignore'));
  const ignored = (path: string) => spawnSync('git', ['check-ignore', '-q', '--no-index', path], { cwd: root }).status;
  assert.equal(ignored('sources/news/event/story.md'), 1);
  assert.equal(ignored('sources/workflows/event/outline.md'), 1);
  assert.equal(ignored('sources/private/notes.md'), 0);
  assert.equal(ignored('sources/notes.md'), 0);
  assert.equal(ignored('authoring/old.md'), 0);
});
