import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { imageIssues, validAttributionUrl, validImagePath } from '../src/lib/content-image';
import { validateMarkdown } from '../scripts/validate-content';

const root = fileURLToPath(new URL('./fixtures/content-image', import.meta.url));
const image = {
  src: '/images/nested/pixel.png',
  alt: 'A pixel',
  credit: 'Example creator',
  sourceUrl: 'https://example.com/image',
  licenseUrl: 'https://example.com/license',
};

test('accepts a local raster with complete attribution', () => {
  assert.equal(validImagePath(image.src, root), true);
  assert.deepEqual(imageIssues(image, root), []);
});

test('rejects unsafe, missing, non-raster and escaping image paths', () => {
  for (const path of [
    'https://example.com/image.png', '//example.com/image.png', '/images/../outside.png',
    '/images/%2e%2e/outside.png', '/images/%252e%252e/outside.png',
    '/images/nested%2fpixel.png', '/images/nested\\pixel.png', '/images/nested//pixel.png',
    '/images/nested/pixel.png?x=1', '/images/nested/pixel.png#fragment',
    '/images/missing.png', '/images/example.svg', '/images/disguised.png', '/images/escape.png',
  ]) assert.equal(validImagePath(path, root), false, path);
  const linkedRoot = fileURLToPath(new URL('./fixtures/content-image-linked', import.meta.url));
  assert.equal(validImagePath(image.src, linkedRoot), false);
});

test('requires meaningful attribution and absolute HTTP(S) links', () => {
  for (const url of ['javascript:alert(1)', '//example.com', '/license', 'data:text/plain,x', 'https://', 'https://user:pass@example.com', 'https://example.com/\npath', 'https:\\\\example.com']) {
    assert.equal(validAttributionUrl(url), false, url);
  }
  assert.equal(validAttributionUrl('http://example.com/license'), true);
  assert.deepEqual(imageIssues({ ...image, alt: ' ', credit: '', sourceUrl: 'javascript:1', licenseUrl: '/license' }, root).map((issue) => issue.field), ['alt', 'credit', 'sourceUrl', 'licenseUrl']);
});

test('content validation preserves absent images and rejects incomplete image metadata', () => {
  assert.deepEqual(validateMarkdown('---\ntitle: Example\n---\nBody'), []);
  const issues = validateMarkdown('---\nimage:\n  src: /images/missing.png\n  alt: ""\n  credit: ""\n  sourceUrl: javascript:alert\n  licenseUrl: /license\n---\nBody');
  for (const field of ['src', 'alt', 'credit', 'sourceUrl', 'licenseUrl']) {
    assert.ok(issues.some((issue) => issue.startsWith(`image.${field}:`)), field);
  }
});
