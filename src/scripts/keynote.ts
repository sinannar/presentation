import { keynoteShortcut } from '../lib/keynote-shortcuts';
import { installKeynoteRemote } from './remote';

document.documentElement.classList.add('js');

const scenes = [...document.querySelectorAll<HTMLElement>('[data-scene]')];
const controls = document.querySelector<HTMLElement>('.keynote-controls');
const dialog = document.querySelector<HTMLDialogElement>('.help-dialog');
const previous = document.querySelector<HTMLButtonElement>('[data-prev]');
const next = document.querySelector<HTMLButtonElement>('[data-next]');
const sceneLabel = document.querySelector<HTMLElement>('[data-scene-name]');
const count = document.querySelector<HTMLElement>('[data-count]');
const status = document.querySelector<HTMLElement>('[data-keynote-status]');
const stage = document.querySelector<HTMLElement>('.keynote-stage');

if (scenes.length && controls && dialog && previous && next && sceneLabel && count && status && stage) {
  let current = 0;
  const remoteListeners = new Set<() => void>();
  const sceneName = (scene: HTMLElement) =>
    scene.querySelector('h1, h2')?.textContent?.trim() || 'Presentation';
  const render = (index: number, updateHash = true, moveFocus = false) => {
    current = Math.max(0, Math.min(index, scenes.length - 1));
    scenes.forEach((scene, i) => { scene.hidden = i !== current; });
    sceneLabel.textContent = sceneName(scenes[current]);
    count.textContent = `${current + 1} / ${scenes.length}`;
    previous.disabled = current === 0;
    next.disabled = current === scenes.length - 1;
    if (updateHash) history.replaceState(null, '', `#${encodeURIComponent(scenes[current].dataset.scene || 'home')}`);
    if (moveFocus) stage.focus({ preventScroll: true });
    remoteListeners.forEach((listener) => listener());
  };
  const readHash = () => {
    let id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { /* Ignore malformed hashes. */ }
    return Math.max(0, scenes.findIndex((scene) => scene.dataset.scene === id));
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else throw new Error('Fullscreen unavailable');
      status.textContent = '';
    } catch {
      status.textContent = 'Fullscreen is unavailable in this browser.';
    }
  };
  const openHelp = () => { if (!dialog.open) dialog.showModal(); };
  controls.hidden = false;
  render(readHash(), false);
  const remote = installKeynoteRemote({
    getIndex: () => current,
    getCount: () => scenes.length,
    setIndex: (index) => render(index, true, true),
    onNavigate: (listener) => {
      remoteListeners.add(listener);
      return () => remoteListeners.delete(listener);
    },
  });
  window.addEventListener('hashchange', () => render(readHash(), false));
  document.querySelector('[data-start]')?.addEventListener('click', () => render(1, true, true));
  document.querySelector('[data-home]')?.addEventListener('click', () => render(0, true, true));
  previous.addEventListener('click', () => render(current - 1, true, true));
  next.addEventListener('click', () => render(current + 1, true, true));
  document.querySelector('[data-help]')?.addEventListener('click', openHelp);
  document.querySelector('[data-close-help]')?.addEventListener('click', () => dialog.close());
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented) return;
    const target = event.target;
    const element = target instanceof HTMLElement ? target : null;
    const action = keynoteShortcut(event.key, {
      dialogOpen: dialog.open || remote.isOpen(),
      modified: event.altKey || event.ctrlKey || event.metaKey,
      editing: !!(element?.isContentEditable || element?.closest('input, textarea, select')),
      interactive: !!element?.closest('button, a'),
    });
    if (!action) return;
    event.preventDefault();
    switch (action) {
      case 'next': render(current + 1); break;
      case 'previous': render(current - 1); break;
      case 'home': render(0); break;
      case 'help': openHelp(); break;
      case 'fullscreen': void toggleFullscreen(); break;
      case 'remote': remote.open(); break;
    }
  });
}

