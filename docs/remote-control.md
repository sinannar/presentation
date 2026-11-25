# Optional phone and tablet remote

The remote is off by default. Press **R** to open its dialog; opening it does not connect. Select **Enable remote** on the presentation, then scan the QR code or open `/remote/` under the same site base path and enter the code. On the other device, select **Join** explicitly. A QR URL only fills the field; it does not join. Close the dialog to present while keeping the remote active. Press **R** again and select **Disable remote** when finished; leaving the page also disconnects it. Re-enabling creates a new code.

For phone pairing, open the published HTTPS site on the presentation computer. A QR code containing `localhost` refers to the phone itself, not the presentation computer. Plain HTTP on a LAN address is not a secure context and cannot use Web Crypto; use HTTPS instead.

This feature connects each consenting device to the public MQTT-over-WebSocket broker `wss://broker.emqx.io:8084/mqtt`. The broker sees IP addresses, the public topic, timing and ciphertext, and can delay, drop or block messages. It may be unavailable. The pairing code contains an independently random public topic and 256-bit secret; the secret is shared in the URL fragment and is never sent to the broker. Web Crypto AES-GCM encrypts and authenticates protocol messages, using a fresh random 96-bit IV for each message and binding ciphertext to its direction-specific topic. Per-sender sequence tracking rejects replays, and a fresh guest challenge prevents replaying a previous guest session's state. Up to 128 distinct senders/challenges are accepted per session; disable and re-enable to start fresh if exhausted.

The code is a bearer capability: anyone who has it can control the presentation while enabled. Keep the code and QR private. Encryption does not protect against a compromised browser or device, a malicious participant with the code, or a broker that disrupts traffic. Speaker notes are not supported. Only protocol metadata, bounded screen positions and control messages are encrypted; no titles, presentation content or notes are sent. Messages are not retained, and the application does not persist pairing codes. Browser history, screenshots, cameras and other software may expose a displayed code.

If offline or no host responds, the interface reports the problem; reconnect manually. Local keyboard and presentation controls remain available. Public relay availability, browser/network WebSocket restrictions, and QR scanning depend on the environment. The two devices must be able to reach the same broker. Secure random generation requires a secure browser context (HTTPS or localhost). No account or credentials are required.

## Integration for the keynote

The starter keynote integrates the standalone remote page in `src/scripts/keynote.ts`. If you replace the navigation implementation, preserve the integration by importing `installKeynoteRemote` from `./remote` and calling it inside the initialized keynote block after initial render:

```ts
const remoteListeners = new Set<() => void>();
const remote = installKeynoteRemote({
  getIndex: () => flatPosition(revealCounts, position),
  getCount: () => totalPositions,
  setIndex: (index) => render(positionFromFlat(revealCounts, index), true, true),
  onNavigate: (listener) => {
    remoteListeners.add(listener);
    return () => remoteListeners.delete(listener);
  },
});
```

Declare `remoteListeners` before `render`, and invoke its listeners at the end of **every** `render` call after `current` changes, including hash, keyboard, and local navigation: `remoteListeners.forEach((listener) => listener());`. Call `remote.open()` for the **R** shortcut, and `remote.dispose()` if the keynote is removed. Do not mount more than once.

The relay protocol uses separate public-topic-scoped host and guest topics, QoS 0 and no retained publishes. It navigates sequential reveal steps as well as screens. It ignores retained, unauthenticated, replayed, malformed, oversized and out-of-range messages. Delivery is not guaranteed; out-of-order messages may be discarded, and stale or missing responses may require a manual rejoin. Automated tests use an in-memory mock transport and do not contact the broker.
