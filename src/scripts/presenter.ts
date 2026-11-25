import '../styles/presenter.css';
import { isPresenterCommand, isPresenterState, presenterStorageKey, type PresenterCommand, type PresenterState } from '../lib/presenter-protocol';
export type { PresenterState } from '../lib/presenter-protocol';

const storageKey = presenterStorageKey(import.meta.env.BASE_URL);
type Details = { name: string; role: string; organization: string };
const blankDetails = (): Details => ({ name: '', role: '', organization: '' });
function readDetails(): Details {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (!value || typeof value !== 'object') return blankDetails();
    const obj = value as Record<string, unknown>;
    return { name: typeof obj.name === 'string' ? obj.name.slice(0, 200) : '', role: typeof obj.role === 'string' ? obj.role.slice(0, 200) : '', organization: typeof obj.organization === 'string' ? obj.organization.slice(0, 200) : '' };
  } catch { return blankDetails(); }
}
function showNotes(container: HTMLElement, state: PresenterState): void {
  container.replaceChildren();
  for (const [heading, values] of [['Talking points', state.notes.talkingPoints], ['Technical details', state.notes.technicalDetails]] as const) {
    const title = document.createElement('h3'); title.textContent = heading; container.append(title);
    const list = document.createElement('ul');
    for (const value of values) { const item = document.createElement('li'); item.textContent = value; list.append(item); }
    if (!values.length) { const item = document.createElement('li'); item.textContent = 'None'; list.append(item); }
    container.append(list);
  }
  const heading = document.createElement('h3'); heading.textContent = 'Transition';
  const transition = document.createElement('p'); transition.textContent = state.notes.transition || 'None';
  container.append(heading, transition);
}

export function installPresenterTools({ getState, subscribe, navigate }: {
  getState: () => PresenterState; subscribe: (listener: () => void) => () => void; navigate: (command: PresenterCommand) => void;
}): { openPresenter(): void; toggleNotes(): void; openDetails(): void; isDialogOpen(): boolean; dispose(): void } {
  const panel = document.createElement('aside'); panel.className = 'presenter-notes-panel'; panel.hidden = true;
  panel.setAttribute('aria-label', 'Speaker notes');
  const panelHeading = document.createElement('h2'); panelHeading.textContent = 'Speaker notes';
  const panelHeader = document.createElement('div'); panelHeader.className = 'presenter-panel-header';
  const closePanel = document.createElement('button'); closePanel.type = 'button'; closePanel.textContent = 'Close'; closePanel.addEventListener('click', () => { panel.hidden = true; });
  panelHeader.append(panelHeading, closePanel);
  const notes = document.createElement('div'); panel.append(panelHeader, notes); document.body.append(panel);
  const status = document.createElement('p'); status.className = 'presenter-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); document.body.append(status);
  const dialog = document.createElement('dialog'); dialog.className = 'presenter-dialog'; dialog.setAttribute('aria-label', 'Presenter details');
  const form = document.createElement('form');
  const title = document.createElement('h2'); title.textContent = 'Presenter details'; form.append(title);
  const description = document.createElement('p');
  description.textContent = 'Shown on the opening screen and stored in this browser.';
  form.append(description);
  const inputs = {} as Record<keyof Details, HTMLInputElement>;
  for (const [key, label] of [['name', 'Name'], ['role', 'Role'], ['organization', 'Organization']] as const) {
    const wrapper = document.createElement('label'); wrapper.textContent = label;
    const input = document.createElement('input'); input.name = key; input.maxLength = 200; wrapper.append(input); inputs[key] = input; form.append(wrapper);
  }
  const actions = document.createElement('div'); actions.className = 'presenter-actions';
  const save = document.createElement('button'); save.type = 'submit'; save.textContent = 'Save';
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Cancel'; cancel.addEventListener('click', () => dialog.close());
  const clear = document.createElement('button'); clear.type = 'button'; clear.textContent = 'Clear';
  actions.append(save, clear, cancel); form.append(actions); dialog.append(form); document.body.append(dialog);
  let detailsElement = document.querySelector<HTMLElement>('[data-presenter-details]');
  const createdDetails = !detailsElement;
  if (!detailsElement) {
    detailsElement = document.createElement('p'); detailsElement.dataset.presenterDetails = '';
    (document.querySelector('[data-scene="home"]') || document.body).append(detailsElement);
  }
  const renderDetails = (details: Details) => {
    const text = [details.name, details.role, details.organization].filter(Boolean).join(' · ');
    if (detailsElement) detailsElement.textContent = text ? `Presented by ${text}` : '';
  };
  renderDetails(readDetails());
  clear.addEventListener('click', () => {
    try { localStorage.removeItem(storageKey); status.textContent = ''; }
    catch { status.textContent = 'Presenter details could not be cleared from this browser.'; }
    for (const key of ['name', 'role', 'organization'] as const) inputs[key].value = '';
    renderDetails(blankDetails());
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault(); const details = { name: inputs.name.value.trim(), role: inputs.role.value.trim(), organization: inputs.organization.value.trim() };
    try { localStorage.setItem(storageKey, JSON.stringify(details)); status.textContent = ''; } catch { status.textContent = 'Presenter details could not be saved on this browser.'; }
    renderDetails(details); dialog.close();
  });
  let channel: BroadcastChannel | null = null; let popup: Window | null = null; let watch: number | undefined; let disposed = false;
  const stop = (message?: string) => {
    if (channel) { try { channel.postMessage({ type: 'closed' }); } catch { /* Channel may already be closed. */ } channel.close(); channel = null; }
    if (watch !== undefined) { clearInterval(watch); watch = undefined; }
    popup = null; if (message) status.textContent = message;
  };
  const sendState = () => {
    const state = getState(); if (!isPresenterState(state)) { status.textContent = 'Presenter state is invalid.'; return; }
    const { id, index, count, title, summary, section, step, steps, nextTitle, nextId, nextStep, scenes, notes } = state;
    const publicState = { id, index, count, title, summary, section, step, steps, nextTitle, nextId, nextStep,
      scenes: scenes.map(({ id, index, title, section }) => ({ id, index, title, section })),
      notes: { talkingPoints: [...notes.talkingPoints], technicalDetails: [...notes.technicalDetails], transition: notes.transition } };
    try { channel?.postMessage({ type: 'state', state: publicState, path: location.pathname }); } catch { stop('Presenter connection was lost.'); }
  };
  const update = () => { const state = getState(); if (isPresenterState(state)) { if (!panel.hidden) showNotes(notes, state); if (channel) sendState(); } };
  const unsubscribe = subscribe(update);
  const onPageHide = () => stop();
  window.addEventListener('pagehide', onPageHide);
  return {
    openPresenter() {
      if (disposed) return;
      if (popup && !popup.closed) { popup.focus(); return; }
      stop();
      if (typeof BroadcastChannel === 'undefined' || !globalThis.crypto?.getRandomValues) { status.textContent = 'Presenter window is unavailable in this browser. Use speaker notes instead.'; return; }
      const bytes = new Uint8Array(16);
      try { crypto.getRandomValues(bytes); } catch { status.textContent = 'Presenter session could not be created. Use speaker notes instead.'; return; }
      const room = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      try { channel = new BroadcastChannel(`keynote-presenter-${room}`); } catch { status.textContent = 'Presenter connection is unavailable. Use speaker notes instead.'; return; }
      channel.onmessage = (event: MessageEvent<unknown>) => {
        const message = event.data;
        if (!message || typeof message !== 'object' || Array.isArray(message)) return;
        const data = message as Record<string, unknown>;
        if (data.type === 'hello' || data.type === 'ping') sendState();
        else if (data.type === 'closed') stop('Presenter window closed.');
        else if (data.type === 'command') { const state = getState(); if (isPresenterState(state) && isPresenterCommand(data.command, state)) navigate(data.command); }
      };
      const url = new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/presenter/`, location.origin); url.hash = room;
      try { popup = window.open(url.href, '_blank', 'popup,width=1200,height=800'); } catch { popup = null; }
      if (!popup) { stop('Presenter window was blocked. Allow popups or use speaker notes instead.'); return; }
      status.textContent = 'Presenter window opened.';
      watch = window.setInterval(() => { if (popup?.closed) stop('Presenter window closed.'); }, 1000);
    },
    toggleNotes() { if (disposed) return; panel.hidden = !panel.hidden; if (!panel.hidden) update(); },
    openDetails() { if (disposed || dialog.open) return; const details = readDetails(); for (const key of ['name', 'role', 'organization'] as const) inputs[key].value = details[key]; dialog.showModal(); },
    isDialogOpen: () => dialog.open,
    dispose() { if (disposed) return; disposed = true; unsubscribe(); window.removeEventListener('pagehide', onPageHide); stop(); panel.remove(); status.remove(); dialog.remove(); if (createdDetails) detailsElement?.remove(); },
  };
}
