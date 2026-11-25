import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { validateResearch } from '../scripts/validate-research';
import { checkSourceRefs, inventorySources } from '../scripts/source-inventory';

test('research records require claim sources and permission metadata for approved images', () => {
  const record = readFileSync('examples/research/news/sample-news.md', 'utf8');
  assert.deepEqual(validateResearch(record), []);
  assert.match(validateResearch(record.replace('https://example.com/announcement\nimages', 'javascript:alert\nimages')).join(' '), /claim needs/);
  assert.match(validateResearch(record.replace('images: []', 'images:\n  - source: https://example.com/image\n    approved: true')).join(' '), /approved image requires/);
  assert.deepEqual(validateResearch(record.replace('images: []', 'images:\n  - source: https://example.com/image\n    approved: false')), []);
  assert.match(validateResearch(record.replace('published: 2026-01-01', 'published: "2026-02-31"')).join(' '), /calendar date/);
  assert.match(validateResearch(record.replace('retrieved: 2026-01-02T00:00:00Z', 'retrieved: "2026-01-02"')).join(' '), /timestamp/);
});

test('research handoff references detect missing or changed records', () => {
  const { files, errors } = inventorySources(process.cwd(), 'examples/research/news');
  assert.deepEqual(errors, []);
  const references = JSON.parse(readFileSync('examples/research/references.json', 'utf8')) as string[];
  assert.deepEqual(checkSourceRefs(references, files), []);
  assert.match(checkSourceRefs(references, [{ ...files[0], sha256: '0'.repeat(64) }]).join(' '), /stale/);
  assert.match(checkSourceRefs(references, []).join(' '), /not found/);
});
