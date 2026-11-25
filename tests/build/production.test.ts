import { strict as assert } from 'node:assert';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const dist = resolve('dist');
const base = (process.env.ASTRO_BASE || '/').replace(/^\/|\/$/g, '');
const prefix = base ? `/${base}/` : '/';

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

test('production keynote contains styled presentation controls', () => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  assert.match(html, /<h1\b/);
  assert.match(html, /data-scene=/);
  assert.match(html, /<dialog\b/);
  assert.match(html, /Getting around/);
  assert.ok(html.includes(`${prefix}docs/`), 'docs link should include the configured base');
  const css = files(dist).filter((file) => file.endsWith('.css')).map((file) => readFileSync(file, 'utf8')).join('\n');
  assert.match(html + css, /keynote-stage/, 'the keynote stylesheet must be included in the output');
});

test('generated local assets and links resolve under the configured base', () => {
  for (const file of files(dist).filter((path) => path.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8');
    for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      const url = match[1];
      assert.ok(url.startsWith(prefix), `${file}: ${url} does not use base ${prefix}`);
      const local = decodeURIComponent(url.slice(prefix.length));
      const path = join(dist, local);
      assert.ok(existsSync(path) || existsSync(join(path, 'index.html')), `${file}: missing ${url}`);
    }
  }
});

test('private input directories are not copied to the output', () => {
  assert.equal(existsSync(join(dist, 'sources')), false);
  assert.equal(existsSync(join(dist, 'authoring')), false);
});
