const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const HEX = /^[0-9a-f]+$/;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}
export function randomHex(length: number): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(length)));
}
export function validCode(code: string): boolean {
  return /^[0-9a-f]{32}\.[0-9a-f]{64}$/.test(code);
}
export function newCode(): string {
  return `${randomHex(16)}.${randomHex(32)}`;
}

export async function createCipher(secret: string) {
  if (!/^[0-9a-f]{64}$/.test(secret)) throw new Error('Invalid secret');
  const key = await crypto.subtle.importKey('raw', hexToBytes(secret), 'AES-GCM', false, ['encrypt', 'decrypt']);
  const sender = randomHex(16);
  let sequence = 0;
  const seen = new Map<string, number>();
  return {
    async encrypt(topic: string, message: object): Promise<string> {
      if (sequence >= Number.MAX_SAFE_INTEGER) throw new Error('Sequence exhausted');
      const plaintext = encoder.encode(JSON.stringify({ sender, sequence: ++sequence, message }));
      if (plaintext.length > 256) throw new Error('Message too large');
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(topic), tagLength: 128 }, key, plaintext);
      return JSON.stringify({ v: 1, iv: bytesToHex(iv), ciphertext: bytesToHex(new Uint8Array(ciphertext)) });
    },
    async decrypt(topic: string, payload: string): Promise<unknown> {
      if (payload.length > 640) return null;
      try {
        const envelope: unknown = JSON.parse(payload);
        if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) return null;
        const data = envelope as Record<string, unknown>;
        if (Object.keys(data).length !== 3 || data.v !== 1 || typeof data.iv !== 'string' ||
            !/^[0-9a-f]{24}$/.test(data.iv) || typeof data.ciphertext !== 'string' ||
            data.ciphertext.length < 32 || data.ciphertext.length > 544 || data.ciphertext.length % 2 !== 0 || !HEX.test(data.ciphertext)) return null;
        const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: hexToBytes(data.iv), additionalData: encoder.encode(topic), tagLength: 128 }, key, hexToBytes(data.ciphertext));
        const value: unknown = JSON.parse(decoder.decode(plaintext));
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
        const record = value as Record<string, unknown>;
        if (Object.keys(record).length !== 3 || typeof record.sender !== 'string' || !/^[0-9a-f]{32}$/.test(record.sender) ||
            !Number.isSafeInteger(record.sequence) || (record.sequence as number) < 1) return null;
        const previous = seen.get(record.sender);
        if (previous !== undefined && (record.sequence as number) <= previous) return null;
        // Never evict senders: otherwise an old authenticated packet could be replayed.
        if (previous === undefined && seen.size >= 128) return null;
        seen.set(record.sender, record.sequence as number);
        return record.message;
      } catch { return null; }
    },
  };
}
