import '../styles/remote.css';
import { createRemoteSession, type HostHooks, type RemoteState } from '../lib/remote-session';
import { newCode, validCode } from '../lib/remote-crypto';

const warning = 'The public broker sees IP addresses, topic and timing, and can disrupt the session. Messages are encrypted; a compromised device or anyone with the pairing code can control the presentation. Speaker notes are not supported.';

export function installKeynoteRemote(hooks: HostHooks) {
  const dialog = document.createElement('dialog');
  dialog.className = 'remote-dialog';
  dialog.setAttribute('aria-labelledby', 'remote-host-title');
  dialog.innerHTML = `
    <h2 id="remote-host-title">Phone or tablet remote</h2>
    <p class="remote-warning"></p>
    <p>Enable to connect to the public relay. Scan the QR code or enter the code on the remote device; that device must also choose Join.</p>
    <p class="remote-status" role="status" aria-live="polite">Remote is off. No relay connection.</p>
    <div class="remote-pairing" hidden>
      <img class="remote-qr" alt="QR code for the remote page" width="220" height="220" hidden />
      <label>Pairing code <input class="remote-code" readonly spellcheck="false" /></label>
      <p>Open <a class="remote-link"></a> on your device if you cannot scan the QR code.</p>
    </div>
    <div class="remote-actions">
      <button class="remote-enable" type="button">Enable remote</button>
      <button class="remote-disable" type="button" disabled>Disable remote</button>
      <button class="remote-close" type="button">Close</button>
    </div>`;
  document.body.append(dialog);
  const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  dialog.querySelector('.remote-warning')!.textContent = warning + (localHost
    ? ' This localhost link only works on this computer. Use the HTTPS published site on both devices for phone pairing.'
    : '');
  const status = dialog.querySelector<HTMLElement>('.remote-status')!;
  const pairing = dialog.querySelector<HTMLElement>('.remote-pairing')!;
  const qr = dialog.querySelector<HTMLImageElement>('.remote-qr')!;
  const codeInput = dialog.querySelector<HTMLInputElement>('.remote-code')!;
  const link = dialog.querySelector<HTMLAnchorElement>('.remote-link')!;
  const enable = dialog.querySelector<HTMLButtonElement>('.remote-enable')!;
  const disable = dialog.querySelector<HTMLButtonElement>('.remote-disable')!;
  const remoteUrl = new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/remote/`, location.origin);
  link.href = remoteUrl.href;
  link.textContent = remoteUrl.href;
  let session: ReturnType<typeof createRemoteSession> | undefined;
  let generation = 0;
  const stop = () => {
    generation++;
    session?.stop();
    session = undefined;
    pairing.hidden = true;
    qr.hidden = true;
    qr.removeAttribute('src');
    codeInput.value = '';
    enable.disabled = false;
    disable.disabled = true;
  };
  enable.addEventListener('click', () => {
    stop();
    const run = generation;
    if (!window.isSecureContext || !crypto.subtle) {
      status.textContent = 'Remote requires HTTPS or localhost. Open the published HTTPS site and try again.';
      return;
    }
    try {
      const code = newCode();
      codeInput.value = code;
      const pairUrl = new URL(remoteUrl);
      pairUrl.hash = code;
      pairing.hidden = false;
      enable.disabled = true;
      disable.disabled = false;
      session = createRemoteSession({
        role: 'host', code, hooks,
        status(value) {
          if (run !== generation) return;
          if (value === 'offline') {
            stop();
            status.textContent = 'Remote offline: connection failed or was lost. Enable again to retry.';
          } else status.textContent = value === 'connected'
            ? 'Remote enabled and connected. Anyone with the code can control this presentation.'
            : 'Connecting to the public relay…';
        },
      });
      void session.start();
      void import('qrcode').then(({ toDataURL }) => toDataURL(pairUrl.href, { margin: 2, width: 220 }))
        .then((url) => {
          if (run !== generation) return;
          qr.src = url;
          qr.hidden = false;
        }).catch(() => {
          if (run === generation) status.textContent = 'QR unavailable. Use the pairing code and remote page link.';
        });
    } catch {
      stop();
      status.textContent = 'Remote unavailable: secure random pairing is not supported in this browser.';
    }
  });
  disable.addEventListener('click', () => { stop(); status.textContent = 'Remote is off. No relay connection.'; });
  dialog.querySelector('.remote-close')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => event.stopPropagation());
  const onPageHide = () => { stop(); status.textContent = 'Remote is off. No relay connection.'; };
  window.addEventListener('pagehide', onPageHide);
  return {
    open: () => { if (!dialog.open) dialog.showModal(); },
    isOpen: () => dialog.open,
    dispose: () => { window.removeEventListener('pagehide', onPageHide); stop(); dialog.remove(); },
  };
}

export function initializeRemotePage(): void {
  const form = document.querySelector<HTMLFormElement>('#remote-join')!;
  const input = document.querySelector<HTMLInputElement>('#remote-code')!;
  const status = document.querySelector<HTMLElement>('#remote-status')!;
  const join = document.querySelector<HTMLButtonElement>('#remote-join-button')!;
  const leave = document.querySelector<HTMLButtonElement>('#remote-leave')!;
  const previous = document.querySelector<HTMLButtonElement>('#remote-previous')!;
  const next = document.querySelector<HTMLButtonElement>('#remote-next')!;
  const position = document.querySelector<HTMLElement>('#remote-position')!;
  const fragment = location.hash.slice(1);
  if (validCode(fragment)) input.value = fragment;
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  let session: ReturnType<typeof createRemoteSession> | undefined;
  let current: RemoteState | undefined;
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending = false;
  const clearTimer = () => { if (timer) clearTimeout(timer); timer = undefined; };
  const updateControls = () => {
    previous.disabled = !current || pending || current.index === 0;
    next.disabled = !current || pending || current.index >= current.count - 1;
    position.textContent = current ? `Step ${current.index + 1} of ${current.count}` : 'No presentation state yet.';
  };
  const stop = () => {
    generation++;
    clearTimer();
    session?.stop();
    session = undefined;
    current = undefined;
    pending = false;
    join.disabled = false;
    input.disabled = false;
    leave.disabled = true;
    updateControls();
  };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const code = input.value.trim().toLowerCase();
    if (!validCode(code)) {
      status.textContent = 'Enter the complete pairing code shown on the presentation.';
      return;
    }
    stop();
    const run = generation;
    join.disabled = true;
    input.disabled = true;
    leave.disabled = false;
    session = createRemoteSession({
      role: 'guest', code,
      status(value) {
        if (run !== generation) return;
        if (value === 'offline') {
          stop();
          status.textContent = 'Remote offline: connection failed or was lost. Join again to retry.';
        } else if (value === 'connecting') status.textContent = 'Connecting to the public relay…';
        else {
          status.textContent = current ? 'Connected to the presentation.' : 'Connected to relay; waiting for the presentation.';
          if (!current) timer = setTimeout(() => {
            status.textContent = 'No response from the presentation. Check the code and that remote is enabled, then rejoin.';
          }, 5000);
        }
      },
      state(value) {
        if (run !== generation) return;
        clearTimer();
        current = value;
        pending = false;
        status.textContent = 'Connected to the presentation.';
        updateControls();
      },
    });
    void session.start();
  });
  const navigate = (delta: number) => {
    if (!current || pending || !session) return;
    const index = current.index + delta;
    if (index < 0 || index >= current.count) return;
    pending = true;
    updateControls();
    session.setIndex(index);
    clearTimer();
    if (!pending) return;
    timer = setTimeout(() => {
      pending = false;
      status.textContent = 'No response from the presentation. Check the connection or rejoin.';
      updateControls();
    }, 5000);
  };
  previous.addEventListener('click', () => navigate(-1));
  next.addEventListener('click', () => navigate(1));
  leave.addEventListener('click', () => { stop(); status.textContent = 'Disconnected. Join to connect again.'; });
  window.addEventListener('pagehide', stop);
  updateControls();
}
