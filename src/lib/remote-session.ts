import { createCipher, randomHex, validCode } from './remote-crypto';

export const MAX_POSITION = 100_000;
export const BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';

export type RemoteState = { index: number; count: number };
type Message = { v: 1; type: 'hello'; challenge: string } | { v: 1; type: 'set'; index: number } |
  { v: 1; type: 'state'; index: number; count: number; challenge: string };
export type Status = 'connecting' | 'connected' | 'offline';

export interface Transport {
  subscribe(topic: string): Promise<void>;
  publish(topic: string, payload: string): void;
  close(): void;
}
export type TransportFactory = (handlers: {
  message: (topic: string, payload: string, retained: boolean) => void;
  offline: () => void;
  signal: AbortSignal;
}) => Promise<Transport>;

function validPosition(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= MAX_POSITION;
}

export function parseMessage(data: unknown): Message | null {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const record = data as Record<string, unknown>;
    if (record.v !== 1) return null;
    if (record.type === 'hello' && Object.keys(record).length === 3 && typeof record.challenge === 'string' &&
        /^[0-9a-f]{32}$/.test(record.challenge)) return { v: 1, type: 'hello', challenge: record.challenge };
    if (record.type === 'set' && Object.keys(record).length === 3 && validPosition(record.index)) {
      return { v: 1, type: 'set', index: record.index };
    }
    if (record.type === 'state' && Object.keys(record).length === 5 && validPosition(record.index) &&
        validPosition(record.count) && record.count > 0 && record.index < record.count &&
        typeof record.challenge === 'string' && /^[0-9a-f]{32}$/.test(record.challenge)) {
      return { v: 1, type: 'state', index: record.index, count: record.count, challenge: record.challenge };
    }
  return null;
}

export async function mqttTransport(handlers: Parameters<TransportFactory>[0]): Promise<Transport> {
  const { default: mqtt } = await import('mqtt');
  if (handlers.signal.aborted) throw new Error('Cancelled');
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(BROKER_URL, {
      reconnectPeriod: 0, connectTimeout: 10_000, clean: true, forceNativeWebSocket: true,
    });
    let settled = false;
    handlers.signal.addEventListener('abort', () => {
      client.end(true);
      if (!settled) {
        settled = true;
        reject(new Error('Cancelled'));
      }
    }, { once: true });
    client.on('message', (topic, payload, packet) => {
      if (payload.length <= 640) handlers.message(topic, payload.toString(), packet.retain);
    });
    client.on('connect', () => {
      if (settled) return;
      settled = true;
      resolve({
        subscribe: (topic) => new Promise((ok, fail) => {
          const timeout = setTimeout(() => fail(new Error('Subscription timed out')), 10_000);
          client.subscribe(topic, { qos: 0 }, (error, grants) => {
            clearTimeout(timeout);
            if (error || !grants?.length || grants.some((grant) => grant.qos === 128)) {
              fail(error || new Error('Subscription rejected'));
            } else ok();
          });
        }),
        publish: (topic, payload) => { client.publish(topic, payload, { qos: 0, retain: false }); },
        close: () => { client.end(true); },
      });
    });
    client.on('error', () => {
      if (!settled) {
        settled = true;
        client.end(true);
        reject(new Error('Connection failed'));
      } else handlers.offline();
    });
    client.on('close', () => {
      if (!settled) {
        settled = true;
        reject(new Error('Connection closed'));
      } else handlers.offline();
    });
  });
}

export interface HostHooks {
  getIndex(): number;
  getCount(): number;
  setIndex(index: number): void;
  onNavigate(listener: () => void): () => void;
}

export function createRemoteSession(options: {
  role: 'host' | 'guest';
  code: string;
  transport?: TransportFactory;
  status(status: Status): void;
  hooks?: HostHooks;
  state?(state: RemoteState): void;
}) {
  if (!validCode(options.code)) throw new Error('Invalid pairing code');
  if (options.role === 'host' && !options.hooks) throw new Error('Host hooks required');
  const [publicTopic, secret] = options.code.split('.');
  const prefix = `keynote-remote/v1/${publicTopic}`;
  const inbound = `${prefix}/${options.role === 'host' ? 'host' : 'guest'}`;
  const outbound = `${prefix}/${options.role === 'host' ? 'guest' : 'host'}`;
  let generation = 0;
  let connection: Transport | undefined;
  let unsubscribe: (() => void) | undefined;
  let active = false;
  let ready = false;
  let controller: AbortController | undefined;
  let cipher: Awaited<ReturnType<typeof createCipher>> | undefined;
  let challenge = '';
  const challenges = new Set<string>();

  const send = (message: Message) => {
    if (!active || !ready || !connection || !cipher) return;
    const run = generation;
    const currentCipher = cipher;
    void currentCipher.encrypt(outbound, message).then((payload) => {
      if (active && ready && run === generation) connection?.publish(outbound, payload);
    }).catch(() => {
      if (active && run === generation) { stop(); options.status('offline'); }
    });
  };
  const broadcast = () => {
    if (!options.hooks) return;
    const index = options.hooks.getIndex();
    const count = options.hooks.getCount();
    if (validPosition(index) && validPosition(count) && count > 0 && index < count) {
      for (const challenge of challenges) send({ v: 1, type: 'state', index, count, challenge });
    }
  };
  const stop = () => {
    generation++;
    active = false;
    ready = false;
    controller?.abort();
    controller = undefined;
    cipher = undefined;
    challenges.clear();
    unsubscribe?.();
    unsubscribe = undefined;
    const old = connection;
    connection = undefined;
    old?.close();
  };
  const start = async () => {
    stop();
    const run = generation;
    active = true;
    controller = new AbortController();
    const signal = controller.signal;
    options.status('connecting');
    const offline = () => {
      if (!active || run !== generation) return;
      stop();
      options.status('offline');
    };
    try {
      const newCipher = await createCipher(secret);
      if (!active || run !== generation) return;
      cipher = newCipher;
      challenge = randomHex(16);
      const transport = await (options.transport || mqttTransport)({
        offline,
        signal,
        message: (topic, payload, retained) => {
          if (!active || !ready || run !== generation || topic !== inbound || retained) return;
          void newCipher.decrypt(topic, payload).then((plaintext) => {
          if (!active || !ready || run !== generation) return;
          const message = parseMessage(plaintext);
          if (!message) return;
          if (options.role === 'host' && options.hooks) {
            if (message.type === 'hello') {
              if (!challenges.has(message.challenge) && challenges.size >= 128) return;
              challenges.add(message.challenge);
              broadcast();
            }
            if (message.type === 'set') {
              const count = options.hooks.getCount();
              if (validPosition(count) && count > 0 && message.index < count) {
                options.hooks.setIndex(message.index);
              }
              broadcast();
            }
          } else if (options.role === 'guest' && message.type === 'state' && message.challenge === challenge) {
            options.state?.({ index: message.index, count: message.count });
          }
          });
        },
      });
      if (!active || run !== generation) { transport.close(); return; }
      connection = transport;
      await transport.subscribe(inbound);
      if (!active || run !== generation) return;
      ready = true;
      if (options.role === 'host') {
        unsubscribe = options.hooks!.onNavigate(broadcast);
        broadcast();
      } else send({ v: 1, type: 'hello', challenge });
      options.status('connected');
    } catch {
      offline();
    }
  };
  return {
    start,
    stop,
    setIndex(index: number) {
      if (options.role === 'guest' && validPosition(index)) send({ v: 1, type: 'set', index });
    },
  };
}
