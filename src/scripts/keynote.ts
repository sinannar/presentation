import { keynoteShortcut } from '../lib/keynote-shortcuts';
import { clampPosition, flatPosition, nextPosition, positionFromFlat, previousPosition, type Position } from '../lib/keynote-navigation';
import { installKeynoteRemote } from './remote';
import { installSceneMap } from './scene-map';
import { installPresenterTools, type PresenterState } from './presenter';
import '../styles/feature-navigation.css';
import '../styles/scene-map.css';

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
  const revealElements = scenes.map((scene) => [...scene.querySelectorAll<HTMLElement>('[data-reveal]')]);
  const revealCounts = revealElements.map((elements) => elements.length);
  const totalPositions = revealCounts.reduce((sum, length) => sum + length + 1, 0);
  const preview = new URLSearchParams(location.search).get('preview') === '1';
  let position: Position = { index: 0, step: 0 };
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const sceneName = (scene: HTMLElement) =>
    scene.querySelector('h1, h2')?.textContent?.trim() || 'Presentation';
  const getState = (): PresenterState => {
    const scene = scenes[position.index];
    let notes: PresenterState['notes'] = { talkingPoints: [], technicalDetails: [], transition: '' };
    try {
      const parsed = JSON.parse(scene.dataset.notes || '{}');
      notes = {
        talkingPoints: Array.isArray(parsed.talkingPoints) ? parsed.talkingPoints.filter((x: unknown) => typeof x === 'string') : [],
        technicalDetails: Array.isArray(parsed.technicalDetails) ? parsed.technicalDetails.filter((x: unknown) => typeof x === 'string') : [],
        transition: typeof parsed.transition === 'string' ? parsed.transition : '',
      };
    } catch { /* Missing or malformed optional notes. */ }
    const following = nextPosition(revealCounts, position);
    const hasNext = following.index !== position.index || following.step !== position.step;
    return {
      id: scene.dataset.scene || 'home', index: position.index, count: scenes.length,
      title: sceneName(scene), summary: scene.dataset.summary || '', section: scene.dataset.section || '',
      step: position.step, steps: revealCounts[position.index], notes,
      nextId: hasNext ? scenes[following.index].dataset.scene || 'home' : '',
      nextStep: hasNext ? following.step : 0,
      scenes: scenes.map((item, index) => ({
        id: item.dataset.scene || `scene-${index}`, index,
        title: sceneName(item), section: item.dataset.section || '',
      })),
      nextTitle: position.step < revealCounts[position.index]
        ? `Reveal ${position.step + 1}`
        : scenes[position.index + 1] ? sceneName(scenes[position.index + 1]) : 'End of presentation',
    };
  };
  const render = (nextPositionValue: Position, updateHash = true, moveFocus = false) => {
    position = clampPosition(revealCounts, nextPositionValue);
    scenes.forEach((scene, i) => {
      scene.hidden = i !== position.index;
      revealElements[i].forEach((element, step) => { element.hidden = step >= position.step; });
    });
    sceneLabel.textContent = sceneName(scenes[position.index]);
    count.textContent = `${position.index + 1} / ${scenes.length}` +
      (revealCounts[position.index] ? ` · ${position.step + 1} / ${revealCounts[position.index] + 1}` : '');
    previous.disabled = position.index === 0 && position.step === 0;
    next.disabled = position.index === scenes.length - 1 && position.step === revealCounts[position.index];
    if (updateHash) {
      const id = encodeURIComponent(scenes[position.index].dataset.scene || 'home');
      history.replaceState(null, '', `#${id}${position.step ? `?step=${position.step}` : ''}`);
    }
    if (moveFocus) stage.focus({ preventScroll: true });
    listeners.forEach((listener) => listener());
  };
  const readHash = (): Position => {
    const [encoded, query = ''] = location.hash.slice(1).split('?');
    let id = '';
    try { id = decodeURIComponent(encoded); } catch { /* Ignore malformed hashes. */ }
    const index = Math.max(0, scenes.findIndex((scene) => scene.dataset.scene === id));
    const requested = preview
      ? new URLSearchParams(location.search).get('step')
      : new URLSearchParams(query).get('step');
    const step = requested && /^\d+$/.test(requested) ? Number(requested) : 0;
    return clampPosition(revealCounts, { index, step });
  };
  const jump = (index: number, step = 0) => render({ index, step }, true, true);
  const jumpToId = (id: string) => {
    const index = scenes.findIndex((scene) => scene.dataset.scene === id);
    if (index >= 0) jump(index);
  };
  const advance = () => render(nextPosition(revealCounts, position));
  const back = () => render(previousPosition(revealCounts, position));
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
  render(readHash(), false);
  window.addEventListener('hashchange', () => render(readHash(), false));

  if (preview) {
    document.documentElement.classList.add('keynote-preview');
  } else {
    controls.hidden = false;
    const remote = installKeynoteRemote({
      getIndex: () => flatPosition(revealCounts, position),
      getCount: () => totalPositions,
      setIndex: (index) => render(positionFromFlat(revealCounts, index), true, true),
      onNavigate: subscribe,
    });
    const map = installSceneMap({ scenes, getIndex: () => position.index, jump });
    const presenter = installPresenterTools({
      getState,
      subscribe,
      navigate: (command) => {
        if (command.type === 'next') advance();
        else if (command.type === 'previous') back();
        else if (command.type === 'home') jump(0);
        else if (command.type === 'goto' && Number.isInteger(command.index)) jump(command.index!, command.step || 0);
      },
    });
    const blackout = document.createElement('div');
    blackout.className = 'keynote-blackout';
    blackout.hidden = true;
    blackout.innerHTML = '<button type="button">Return to presentation</button>';
    document.body.append(blackout);
    blackout.querySelector('button')!.addEventListener('click', () => { blackout.hidden = true; stage.focus(); });
    const modalOpen = () => dialog.open || remote.isOpen() || map.isOpen() || presenter.isDialogOpen();
    document.querySelector('[data-start]')?.addEventListener('click', () => jump(1));
    document.querySelector('[data-home]')?.addEventListener('click', () => jump(0));
    previous.addEventListener('click', back);
    next.addEventListener('click', advance);
    document.querySelector('[data-help]')?.addEventListener('click', openHelp);
    document.querySelector('[data-map]')?.addEventListener('click', () => map.open());
    document.querySelector('[data-close-help]')?.addEventListener('click', () => dialog.close());
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-jump-scene]') : null;
      if (target?.dataset.jumpScene) jumpToId(target.dataset.jumpScene);
    });
    document.addEventListener('keydown', (event) => {
      if (event.defaultPrevented) return;
      if (!blackout.hidden && (event.key === 'Escape' || event.key.toLowerCase() === 'b')) {
        event.preventDefault();
        blackout.hidden = true;
        stage.focus();
        return;
      }
      if (!blackout.hidden) return;
      const element = event.target instanceof HTMLElement ? event.target : null;
      const action = keynoteShortcut(event.key, {
        dialogOpen: modalOpen(),
        modified: event.altKey || event.ctrlKey || event.metaKey,
        editing: !!(element?.isContentEditable || element?.closest('input, textarea, select')),
        interactive: !!element?.closest('button, a'),
        shift: event.shiftKey,
      });
      if (!action) return;
      event.preventDefault();
      switch (action) {
        case 'next': advance(); break;
        case 'previous': back(); break;
        case 'next-scene': jump(position.index + 1); break;
        case 'previous-scene': jump(position.index - 1); break;
        case 'home': jump(0); break;
        case 'help': openHelp(); break;
        case 'fullscreen': void toggleFullscreen(); break;
        case 'remote': remote.open(); break;
        case 'map': map.open(); break;
        case 'presenter': presenter.openPresenter(); break;
        case 'notes': presenter.toggleNotes(); break;
        case 'details': presenter.openDetails(); break;
        case 'highlights': jumpToId('highlights'); break;
        case 'hide-controls': controls.hidden = !controls.hidden; break;
        case 'blackout': blackout.hidden = false; blackout.querySelector('button')!.focus(); break;
        case 'skip-reveals': render({ ...position, step: revealCounts[position.index] }); break;
        case 'section': {
          const groups = [...new Set(scenes.filter((scene) => scene.dataset.kind === 'content' && scene.dataset.section).map((scene) => scene.dataset.section!))];
          const group = groups[Number(event.key) - 1];
          const index = scenes.findIndex((scene) => scene.dataset.kind === 'content' && scene.dataset.section === group);
          if (group && index >= 0) jump(index);
          break;
        }
      }
    });
    let touch: { x: number; y: number } | undefined;
    stage.addEventListener('touchstart', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (event.touches.length !== 1 || modalOpen() || target?.closest('button, a, input, textarea, select, [contenteditable="true"]')) {
        touch = undefined;
        return;
      }
      touch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }, { passive: true });
    stage.addEventListener('touchend', (event) => {
      if (!touch || event.changedTouches.length !== 1 || modalOpen()) { touch = undefined; return; }
      const dx = event.changedTouches[0].clientX - touch.x;
      const dy = event.changedTouches[0].clientY - touch.y;
      touch = undefined;
      if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) advance(); else back();
      }
    }, { passive: true });
  }
}
