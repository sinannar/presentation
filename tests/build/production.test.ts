import { strict as assert } from 'node:assert';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
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
  assert.match(html, /<kbd>R<\/kbd>/);
  assert.match(html, /<kbd>F<\/kbd>/);
  assert.doesNotMatch(html, /data-fullscreen/);
  assert.ok(html.includes(`${prefix}docs/`), 'docs link should include the configured base');
  const css = files(dist).filter((file) => file.endsWith('.css')).map((file) => readFileSync(file, 'utf8')).join('\n');
  assert.match(html + css, /keynote-stage/, 'the keynote stylesheet must be included in the output');
});

test('starter overview and highlights link to real published scenes', () => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const sceneIds = new Set([...html.matchAll(/\bdata-scene="([^"]+)"/g)].map((match) => match[1]));
  assert.ok(sceneIds.has('home') && sceneIds.has('sections') && sceneIds.has('highlights'));
  const targets = [...html.matchAll(/\bdata-jump-scene="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(targets.includes('sections') && targets.includes('highlights'));
  for (const target of targets) assert.ok(sceneIds.has(target), `unknown scene target: ${target}`);
  assert.match(html, /data-featured="true"/);
  assert.match(html, /\bdata-reveal(?:[=>\s])/);
  assert.doesNotMatch(html, /<[^>]*data-reveal[^>]*\shidden(?:[=>\s])/);
  assert.match(html, /data-notes="/);
  assert.ok(existsSync(join(dist, 'presenter', 'index.html')), 'presenter route is generated');
});

test('built MQTT browser module supports a native WebSocket', async () => {
  const modulePath = files(join(dist, '_astro')).find((file) => /\/mqtt\.esm\.[^/]+\.js$/.test(file));
  assert.ok(modulePath, 'MQTT browser module is present');
  const mqtt = await import(pathToFileURL(modulePath).href);
  assert.equal(typeof mqtt.default?.connect, 'function');
  const original = globalThis.WebSocket;
  let url = '';
  class MockWebSocket {
    OPEN = 1;
    readyState = 0;
    binaryType = '';
    constructor(address: string) { url = address; }
    addEventListener() {}
    close() {}
  }
  try {
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    const client = mqtt.default.connect('wss://example.test/mqtt', {
      forceNativeWebSocket: true, reconnectPeriod: 0,
    });
    assert.equal(url, 'wss://example.test:443/mqtt');
    client.end(true);
  } finally {
    globalThis.WebSocket = original;
  }
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
