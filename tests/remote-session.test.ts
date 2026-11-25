import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createRemoteSession, parseMessage, type TransportFactory } from '../src/lib/remote-session';
import { createCipher, newCode, validCode } from '../src/lib/remote-crypto';

const code = 'a'.repeat(32) + '.' + 'b'.repeat(64);
const pause = () => new Promise((resolve) => setTimeout(resolve, 10));
async function until(predicate: () => boolean) {
  for (let i = 0; i < 100; i++) { if (predicate()) return; await pause(); }
  throw new Error('Timed out waiting for mock relay');
}
function relay() {
  const clients: Array<{ handlers: Parameters<TransportFactory>[0]; topic?: string; closed: boolean }> = [];
  const published: Array<{ topic: string; payload: string }> = [];
  const factory: TransportFactory = async (handlers) => {
    const client = { handlers, topic: undefined as string | undefined, closed: false };
    clients.push(client);
    return {
      async subscribe(topic) { client.topic = topic; },
      publish(topic, payload) {
        published.push({ topic, payload });
        for (const receiver of clients) if (!receiver.closed && receiver.topic === topic) receiver.handlers.message(topic, payload, false);
      },
      close() { client.closed = true; },
    };
  };
  return { clients, published, factory };
}

test('authenticated host and guest synchronize positions, reject replays and stop', async () => {
  const mock = relay();
  let index = 0;
  let listener = () => {};
  const states: number[] = [];
  const host = createRemoteSession({
    role: 'host', code, transport: mock.factory, status() {},
    hooks: {
      getIndex: () => index, getCount: () => 3,
      setIndex(value) { index = value; listener(); },
      onNavigate(callback) { listener = callback; return () => { listener = () => {}; }; },
    },
  });
  const guest = createRemoteSession({ role: 'guest', code, transport: mock.factory, status() {}, state(value) { states.push(value.index); } });
  assert.equal(mock.clients.length, 0);
  await host.start();
  await guest.start();
  await until(() => states.length > 0);
  assert.equal(states.at(-1), 0);
  guest.setIndex(2);
  await until(() => index === 2 && states.at(-1) === 2);
  const command = mock.published.findLast((item) => item.topic.endsWith('/host'))!;
  const previousState = mock.published.findLast((item) => item.topic.endsWith('/guest'))!;
  index = 1;
  listener();
  await until(() => states.at(-1) === 1);
  mock.clients[0].handlers.message(command.topic, command.payload, false);
  await pause();
  assert.equal(index, 1);
  guest.setIndex(3);
  await pause();
  assert.equal(index, 1);
  const injected = await createCipher('b'.repeat(64));
  const retained = await injected.encrypt(mock.clients[0].topic!, { v: 1, type: 'set', index: 0 });
  mock.clients[0].handlers.message(mock.clients[0].topic!, retained, true);
  await pause();
  assert.equal(index, 1);
  assert.ok(mock.published.every(({ topic, payload }) => !topic.includes('b'.repeat(64)) && !payload.includes('b'.repeat(64))));
  guest.stop();
  const rejoinedStates: number[] = [];
  const rejoined = createRemoteSession({ role: 'guest', code, transport: mock.factory, status() {}, state(value) { rejoinedStates.push(value.index); } });
  await rejoined.start();
  mock.clients.at(-1)!.handlers.message(previousState.topic, previousState.payload, false);
  await until(() => rejoinedStates.length > 0);
  assert.deepEqual(rejoinedStates, [1]);
  host.stop();
  rejoined.setIndex(0);
  await pause();
  assert.equal(index, 1);
  rejoined.stop();
});

test('AES-GCM rejects tampering, wrong key or topic, replay and malformed input', async () => {
  const a = await createCipher('b'.repeat(64));
  const b = await createCipher('b'.repeat(64));
  const other = await createCipher('c'.repeat(64));
  const first = await a.encrypt('topic', { v: 1, type: 'set', index: 1 });
  const second = await a.encrypt('topic', { v: 1, type: 'set', index: 2 });
  assert.notEqual(JSON.parse(first).iv, JSON.parse(second).iv);
  assert.equal(await other.decrypt('topic', first), null);
  assert.equal(await b.decrypt('other', first), null);
  const tampered = JSON.parse(first);
  tampered.ciphertext = (tampered.ciphertext[0] === 'a' ? 'b' : 'a') + tampered.ciphertext.slice(1);
  assert.equal(await b.decrypt('topic', JSON.stringify(tampered)), null);
  assert.deepEqual(await b.decrypt('topic', first), { v: 1, type: 'set', index: 1 });
  assert.equal(await b.decrypt('topic', first), null);
  assert.deepEqual(await b.decrypt('topic', second), { v: 1, type: 'set', index: 2 });
  assert.equal(await b.decrypt('topic', '{}'), null);
  assert.equal(await b.decrypt('topic', 'x'.repeat(641)), null);
  assert.equal(parseMessage({ v: 1, type: 'set', index: 100001 }), null);
  assert.equal(parseMessage({ v: 1, type: 'set', index: -1 }), null);
  assert.equal(parseMessage({ v: 1, type: 'hello', notes: 'secret' }), null);
  assert.equal(validCode(newCode()), true);
  assert.equal(validCode('a'.repeat(64)), false);
});

test('cancellation closes late connections and ignores stale callbacks', async () => {
  let resolve!: (value: Awaited<ReturnType<TransportFactory>>) => void;
  let closed = 0;
  let handlers!: Parameters<TransportFactory>[0];
  const factory: TransportFactory = (callbacks) => {
    handlers = callbacks;
    return new Promise((done) => { resolve = done; });
  };
  const statuses: string[] = [];
  const guest = createRemoteSession({ role: 'guest', code, transport: factory, status: (s) => statuses.push(s) });
  const start = guest.start();
  await until(() => !!resolve);
  guest.stop();
  assert.equal(handlers.signal.aborted, true);
  resolve({ async subscribe() { throw new Error('must not subscribe'); }, publish() {}, close() { closed++; } });
  await start;
  assert.equal(closed, 1);
  handlers.offline();
  assert.deepEqual(statuses, ['connecting']);
});

test('subscription failure reports offline', async () => {
  const statuses: string[] = [];
  let closed = 0;
  const guest = createRemoteSession({ role: 'guest', code, status: (s) => statuses.push(s), transport: async () => ({
    async subscribe() { throw new Error('denied'); }, publish() {}, close() { closed++; },
  }) });
  await guest.start();
  assert.deepEqual(statuses, ['connecting', 'offline']);
  assert.equal(closed, 1);
});
