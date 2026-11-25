import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { Window, type HTMLElement, type HTMLButtonElement, type HTMLDialogElement, type HTMLInputElement } from 'happy-dom';

test('built keynote integrates map, reveals, notes, details, and shortcuts', async () => {
  const base = (process.env.ASTRO_BASE || '/').replace(/^\/|\/$/g, '');
  const prefix = base ? `/${base}/` : '/';
  const html = readFileSync(resolve('dist/index.html'), 'utf8');
  const script = /<script type="module" src="([^"]+)"/.exec(html)?.[1];
  assert.ok(script);
  assert.ok(script.startsWith(prefix));
  const window = new Window({
    url: `https://example.test${prefix}`,
    settings: { disableJavaScriptFileLoading: true, disableCSSFileLoading: true },
  });

  window.document.write(html);
  const globalNames = ['window', 'document', 'location', 'history', 'HTMLElement', 'Element', 'localStorage'] as const;
  const originals = globalNames.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
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
  for (const name of globalNames) Object.defineProperty(globalThis, name, { value: window[name], configurable: true, writable: true });
  window.open = (() => ({ closed: false, focus() {} })) as unknown as typeof window.open;
  const document = window.document;
  const key = (value: string, extra: Record<string, boolean> = {}) =>
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: value, bubbles: true, ...extra }));
  try {
    await import(pathToFileURL(resolve('dist', script.slice(prefix.length))).href);
    const active = () => document.querySelector<HTMLElement>('[data-scene]:not([hidden])')!;
    assert.equal(active().dataset.scene, 'home');
    const controls = document.querySelector<HTMLElement>('.keynote-controls')!;
    assert.equal(controls.hidden, false);
    const home = controls.querySelector<HTMLButtonElement>('[data-home]')!;
    const back = controls.querySelector<HTMLButtonElement>('[data-prev]')!;
    const next = controls.querySelector<HTMLButtonElement>('[data-next]')!;
    const sceneName = controls.querySelector<HTMLElement>('[data-scene-name]')!;
    const count = controls.querySelector<HTMLElement>('[data-count]')!;
    assert.equal(back.disabled, true);
    assert.match(count.textContent || '', /^1 \/ \d+$/);
    next.click();
    assert.equal(active().dataset.scene, 'sections');
    assert.equal(sceneName.textContent, active().querySelector('h2')!.textContent);
    assert.match(count.textContent || '', /^2 \/ \d+$/);
    back.click();
    assert.equal(active().dataset.scene, 'home');
    controls.querySelector<HTMLButtonElement>('[data-map]')!.click();
    const map = document.querySelector<HTMLDialogElement>('.scene-map')!;
    assert.equal(map.open, true);
    map.close();
    controls.querySelector<HTMLButtonElement>('[data-help]')!.click();
    const help = document.querySelector<HTMLDialogElement>('.help-dialog')!;
    assert.equal(help.open, true);
    help.close();

    key('p');
    assert.equal(channels.length, 1);
    channels[0].onmessage!({ data: { type: 'hello' } });
    const message = channels[0].sent.at(-1) as { type: string; state: { id: string; nextId: string; scenes: unknown[] } };
    assert.equal(message.type, 'state');
    assert.equal(message.state.id, 'home');
    assert.equal(message.state.nextId, 'sections');
    assert.ok(message.state.scenes.length > 3);
    channels[0].onmessage!({ data: { type: 'command', command: { type: 'next' } } });
    assert.equal(active().dataset.scene, 'sections');
    channels[0].onmessage!({ data: { type: 'closed' } });
    key('Home');

    key('m');
    assert.equal(map.open, true);
    const firstContent = document.querySelector<HTMLElement>('[data-kind="content"]')!;
    const id = firstContent.dataset.scene!;
    const search = map.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = firstContent.querySelector('h2')!.textContent || '';
    search.dispatchEvent(new window.Event('input', { bubbles: true }));
    search.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    assert.equal(map.open, false);
    assert.equal(active().dataset.scene, id);

    const reveals = [...firstContent.querySelectorAll<HTMLElement>('[data-reveal]')];
    assert.ok(reveals.length);
    assert.equal(reveals[0].hidden, true);
    assert.match(count.textContent || '', / · 1 \/ \d+$/);
    key('ArrowRight');
    assert.equal(reveals[0].hidden, false);
    assert.match(count.textContent || '', / · 2 \/ \d+$/);
    key('ArrowLeft');
    assert.equal(reveals[0].hidden, true);
    key('s');
    assert.ok(reveals.every((reveal) => !reveal.hidden));

    key('n');
    const notes = document.querySelector<HTMLElement>('.presenter-notes-panel')!;
    assert.equal(notes.hidden, false);
    assert.match(notes.textContent || '', /Talking points/);
    key('n');
    assert.equal(notes.hidden, true);
    key('e');
    const details = document.querySelector<HTMLDialogElement>('.presenter-dialog')!;
    assert.equal(details.open, true);
    const name = details.querySelector<HTMLInputElement>('input[name="name"]')!;
    name.value = 'Example presenter';
    details.querySelector('form')!.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    assert.match(document.querySelector('[data-presenter-details]')!.textContent || '', /Example presenter/);
    assert.equal(details.open, false);
    key('t');
    assert.equal(active().dataset.scene, 'highlights');
    home.click();
    assert.equal(active().dataset.scene, 'home');

    key('h');
    assert.equal(controls.hidden, true);
    key('h');
    assert.equal(controls.hidden, false);
    key('b');
    const blackout = document.querySelector<HTMLElement>('.keynote-blackout')!;
    assert.equal(blackout.hidden, false);
    key('Escape');
    assert.equal(blackout.hidden, true);

    key('r');
    const remote = document.querySelector<HTMLDialogElement>('.remote-dialog')!;
    assert.equal(remote.open, true);
    assert.match(remote.querySelector('.remote-status')!.textContent || '', /off/i);
    remote.querySelector<HTMLButtonElement>('.remote-close')!.click();
    assert.equal(remote.open, false);
    key('?');
    assert.equal(document.querySelector<HTMLDialogElement>('.help-dialog')!.open, true);
  } finally {
    await window.happyDOM.abort();
    globalNames.forEach((name, index) => {
      const original = originals[index];
      if (original) Object.defineProperty(globalThis, name, original);
      else Reflect.deleteProperty(globalThis, name);
    });
    if (originalChannel) Object.defineProperty(globalThis, 'BroadcastChannel', originalChannel);
    else Reflect.deleteProperty(globalThis, 'BroadcastChannel');
  }
});
