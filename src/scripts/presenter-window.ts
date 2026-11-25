import { isPresenterState, isRoom, presenterKeyAction, previewUrl, type PresenterCommand, type PresenterState } from '../lib/presenter-protocol';

export function initializePresenterWindow(): void {
  const status = document.querySelector<HTMLElement>('#presenter-status')!;
  const timer = document.querySelector<HTMLElement>('#presenter-timer')!;
  const frame = document.querySelector<HTMLIFrameElement>('#presenter-current')!;
  const nextFrame = document.querySelector<HTMLIFrameElement>('#presenter-next-preview')!;
  const nextFrameContainer = document.querySelector<HTMLElement>('#presenter-next-frame')!;
  const position = document.querySelector<HTMLElement>('#presenter-position')!;
  const summary = document.querySelector<HTMLElement>('#presenter-summary')!;
  const nextTitle = document.querySelector<HTMLElement>('#presenter-next-title')!;
  const notes = document.querySelector<HTMLElement>('#presenter-notes')!;
  const map = document.querySelector<HTMLElement>('#presenter-map')!;
  const notesView = document.querySelector<HTMLElement>('#presenter-notes-view')!;
  const mapView = document.querySelector<HTMLElement>('#presenter-map-view')!;
  const notesTab = document.querySelector<HTMLButtonElement>('#presenter-show-notes')!;
  const mapTab = document.querySelector<HTMLButtonElement>('#presenter-show-map')!;
  const home = document.querySelector<HTMLButtonElement>('#presenter-home')!;
  const previous = document.querySelector<HTMLButtonElement>('#presenter-previous')!;
  const next = document.querySelector<HTMLButtonElement>('#presenter-next')!;
  let started = Date.now();
  const tick = () => { const seconds = Math.max(0, Math.floor((Date.now() - started) / 1000)); timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; };
  const clock = window.setInterval(tick, 1000);
  document.querySelector('#presenter-reset')!.addEventListener('click', () => { started = Date.now(); tick(); });
  const room = location.hash.slice(1);
  history.replaceState(null, '', location.pathname + location.search);
  let channel: BroadcastChannel | null = null; let lastSeen = 0; let monitor: number | undefined; let connected = false;
  const disconnected = (message: string) => {
    connected = false; status.textContent = message; home.disabled = previous.disabled = next.disabled = true;
    map.querySelectorAll('button').forEach((button) => { button.disabled = true; });
  };
  const showSidebar = (view: 'notes' | 'map') => {
    notesView.hidden = view !== 'notes'; mapView.hidden = view !== 'map';
    notesTab.setAttribute('aria-pressed', String(view === 'notes'));
    mapTab.setAttribute('aria-pressed', String(view === 'map'));
  };
  notesTab.addEventListener('click', () => showSidebar('notes'));
  mapTab.addEventListener('click', () => showSidebar('map'));
  const cleanup = () => { if (channel) { try { channel.postMessage({ type: 'closed' }); } catch { /* Already closed. */ } channel.close(); channel = null; } clearInterval(clock); if (monitor !== undefined) clearInterval(monitor); };
  window.addEventListener('pagehide', cleanup, { once: true });
  if (!isRoom(room) || typeof BroadcastChannel === 'undefined') { disconnected('No local presenter session is available. Open this window from the keynote.'); return; }
  try { channel = new BroadcastChannel(`keynote-presenter-${room}`); } catch { disconnected('Local presenter connection is unavailable.'); return; }
  const send = (command: PresenterCommand) => {
    if (!connected) return;
    try { channel?.postMessage({ type: 'command', command }); } catch { disconnected('Presenter connection was lost.'); }
  };
  home.addEventListener('click', () => send({ type: 'home' })); previous.addEventListener('click', () => send({ type: 'previous' })); next.addEventListener('click', () => send({ type: 'next' }));
  map.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-index]') : null;
    if (target && map.contains(target) && !target.disabled) send({ type: 'goto', index: Number(target.dataset.index) });
  });
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    const action = presenterKeyAction(event.key, {
      editing: !!(target?.isContentEditable || target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')),
      interactive: !!target?.closest('button, a'),
      modified: event.altKey || event.ctrlKey || event.metaKey,
    });
    if (!action) return;
    if (action === 'map' || action === 'notes') { event.preventDefault(); showSidebar(action); return; }
    if (connected) { event.preventDefault(); send({ type: action }); }
  });
  let mapSignature = '';
  const render = (state: PresenterState, path: string) => {
    const url = previewUrl(path, state.id, state.step, location.origin);
    const nextUrl = state.nextId ? previewUrl(path, state.nextId, state.nextStep, location.origin) : null;
    if (!url || (state.nextId && !nextUrl)) { disconnected('Invalid presentation preview address.'); return; }
    if (frame.src !== url) frame.src = url;
    nextFrameContainer.hidden = !nextUrl;
    if (nextUrl && nextFrame.src !== nextUrl) nextFrame.src = nextUrl;
    if (!nextUrl) nextFrame.removeAttribute('src');
    position.textContent = `${state.index + 1} / ${state.count} · ${state.title}${state.section ? ` · ${state.section}` : ''}${state.steps ? ` · Step ${state.step} / ${state.steps}` : ''}`;
    summary.textContent = state.summary; nextTitle.textContent = state.nextId ? state.nextTitle : 'End of presentation';
    const signature = JSON.stringify(state.scenes);
    if (signature !== mapSignature) {
      mapSignature = signature; map.replaceChildren();
      for (const scene of state.scenes) {
        const button = document.createElement('button'); button.type = 'button'; button.dataset.index = String(scene.index);
        button.textContent = `${scene.index + 1}. ${scene.title}${scene.section ? ` · ${scene.section}` : ''}`;
        map.append(button);
      }
    }
    map.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      button.disabled = false;
      if (Number(button.dataset.index) === state.index) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    notes.replaceChildren();
    for (const [label, items] of [['Talking points', state.notes.talkingPoints], ['Technical details', state.notes.technicalDetails]] as const) {
      const heading = document.createElement('h3'); heading.textContent = label; const list = document.createElement('ul');
      for (const text of items) { const item = document.createElement('li'); item.textContent = text; list.append(item); }
      if (!items.length) { const item = document.createElement('li'); item.textContent = 'None'; list.append(item); } notes.append(heading, list);
    }
    const heading = document.createElement('h3'); heading.textContent = 'Transition'; const transition = document.createElement('p'); transition.textContent = state.notes.transition || 'None'; notes.append(heading, transition);
    home.disabled = state.index === 0 && state.step === 0; previous.disabled = state.index === 0 && state.step === 0; next.disabled = state.index === state.count - 1 && state.step >= state.steps;
    connected = true; status.textContent = 'Connected locally';
  };
  channel.onmessage = (event: MessageEvent<unknown>) => {
    const data = event.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return;
    const message = data as Record<string, unknown>;
    if (message.type === 'closed') { disconnected('The keynote window closed.'); channel?.close(); channel = null; if (monitor !== undefined) clearInterval(monitor); }
    else if (message.type === 'state' && isPresenterState(message.state) && typeof message.path === 'string') { lastSeen = Date.now(); render(message.state, message.path); }
  };
  channel.postMessage({ type: 'hello' });
  monitor = window.setInterval(() => {
    if (lastSeen && Date.now() - lastSeen > 5000) disconnected('Keynote connection lost. Waiting to reconnect…');
    else if (!lastSeen) disconnected('Waiting for the keynote window…');
    try { channel?.postMessage({ type: 'ping' }); } catch { disconnected('Presenter connection was lost.'); }
  }, 2000);
}
