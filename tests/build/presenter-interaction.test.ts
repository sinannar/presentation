import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { Window, type HTMLElement, type HTMLButtonElement } from 'happy-dom';

test('built presenter window receives state, previews scenes, and sends navigation', async () => {
  const base = (process.env.ASTRO_BASE || '/').replace(/^\/|\/$/g, '');
  const prefix = base ? `/${base}/` : '/';
  const html = readFileSync(resolve('dist/presenter/index.html'), 'utf8');
  const script = /<script type="module" src="([^"]+)"/.exec(html)?.[1];
  assert.ok(script);
  assert.ok(script.startsWith(prefix));
  const window = new Window({
    url: `https://example.test${prefix}presenter/#${'a'.repeat(32)}`,
    settings: { disableJavaScriptFileLoading: true, disableCSSFileLoading: true, disableIframePageLoading: true },
  });
  window.document.write(html);
  const names = ['window', 'document', 'location', 'history', 'HTMLElement', 'Element'] as const;
  const originals = names.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
  const originalChannel = Object.getOwnPropertyDescriptor(globalThis, 'BroadcastChannel');
  const channels: MockChannel[] = [];
  class MockChannel {
    onmessage: ((event: { data: unknown }) => void) | null = null;
    sent: unknown[] = [];
    constructor() { channels.push(this); }
    postMessage(data: unknown) { this.sent.push(data); }
    close() {}
  }
  Object.defineProperty(globalThis, 'BroadcastChannel', { value: MockChannel, configurable: true, writable: true });
  names.forEach((name) => Object.defineProperty(globalThis, name, { value: window[name], configurable: true, writable: true }));
  try {
    await import(pathToFileURL(resolve('dist', script.slice(prefix.length))).href);
    assert.deepEqual(channels[0].sent[0], { type: 'hello' });
    const state = {
      id: 'home', index: 0, count: 2, title: 'Home', summary: 'Opening', section: '',
      step: 0, steps: 0, nextTitle: 'Next', nextId: 'next', nextStep: 0,
      notes: { talkingPoints: ['A talking point'], technicalDetails: [], transition: '' },
      scenes: [{ id: 'home', index: 0, title: 'Home', section: '' }, { id: 'next', index: 1, title: 'Next', section: 'Guide' }],
    };
    channels[0].onmessage!({ data: { type: 'state', state, path: prefix } });
    const document = window.document;
    assert.match(document.querySelector('#presenter-status')!.textContent || '', /Connected/);
    assert.match(document.querySelector('#presenter-notes')!.textContent || '', /A talking point/);
    assert.match(document.querySelector('iframe#presenter-current')!.getAttribute('src') || '', /preview=1.*#home/);
    assert.match(document.querySelector('iframe#presenter-next-preview')!.getAttribute('src') || '', /preview=1.*#next/);
    document.querySelector<HTMLButtonElement>('#presenter-show-map')!.click();
    assert.equal(document.querySelector<HTMLElement>('#presenter-map-view')!.hidden, false);
    document.querySelector<HTMLButtonElement>('#presenter-map button[data-index="1"]')!.click();
    assert.deepEqual(channels[0].sent.at(-1), { type: 'command', command: { type: 'goto', index: 1 } });
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.deepEqual(channels[0].sent.at(-1), { type: 'command', command: { type: 'next' } });
  } finally {
    window.dispatchEvent(new window.Event('pagehide'));
    await window.happyDOM.abort();
    names.forEach((name, index) => {
      const original = originals[index];
      if (original) Object.defineProperty(globalThis, name, original);
      else Reflect.deleteProperty(globalThis, name);
    });
    if (originalChannel) Object.defineProperty(globalThis, 'BroadcastChannel', originalChannel);
    else Reflect.deleteProperty(globalThis, 'BroadcastChannel');
  }
});
