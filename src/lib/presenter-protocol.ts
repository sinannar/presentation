export type PresenterState = {
  id: string; index: number; count: number; title: string; summary: string; section: string;
  step: number; steps: number;
  notes: { talkingPoints: string[]; technicalDetails: string[]; transition: string };
  nextTitle: string; nextId: string; nextStep: number;
  scenes: { id: string; index: number; title: string; section: string }[];
};

export type PresenterCommand = { type: 'next' | 'previous' | 'home' | 'goto'; index?: number; step?: number };
export function presenterStorageKey(base: string): string {
  const path = base.replace(/\/+$/, '') || '/';
  return `keynote-presenter-details:${encodeURIComponent(path)}`;
}
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length <= 10000;
const integer = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.length <= 100 && value.every(text);

export function isPresenterState(value: unknown): value is PresenterState {
  if (!record(value) || !record(value.notes)) return false;
  if (!(text(value.id) && value.id.length > 0 && value.id.length <= 512 &&
    integer(value.index) && integer(value.count) && value.count > 0 && value.index < value.count &&
    integer(value.step) && integer(value.steps) && value.step <= value.steps &&
    text(value.title) && text(value.summary) && text(value.section) && text(value.nextTitle) &&
    text(value.nextId) && value.nextId.length <= 512 && integer(value.nextStep) && value.nextStep <= 10000 &&
    strings(value.notes.talkingPoints) && strings(value.notes.technicalDetails) && text(value.notes.transition) &&
    Array.isArray(value.scenes) && value.scenes.length === value.count && value.scenes.length <= 10000)) return false;
  const ids = new Set<string>();
  for (const [index, scene] of value.scenes.entries()) {
    if (!record(scene) || !text(scene.id) || !scene.id || scene.id.length > 512 || ids.has(scene.id) ||
      scene.index !== index || !text(scene.title) || !text(scene.section)) return false;
    ids.add(scene.id);
  }
  return value.scenes[value.index].id === value.id &&
    (value.nextId ? ids.has(value.nextId) && (value.nextId !== value.id || value.nextStep <= value.steps) : value.nextStep === 0);
}

export function isPresenterCommand(value: unknown, state: PresenterState): value is PresenterCommand {
  if (!record(value)) return false;
  if (value.type === 'next' || value.type === 'previous' || value.type === 'home') {
    return value.index === undefined && value.step === undefined;
  }
  return value.type === 'goto' && integer(value.index) && value.index < state.count &&
    (value.step === undefined || (integer(value.step) && value.index === state.index && value.step <= state.steps));
}

export function previewUrl(path: string, id: string, step: number, origin: string): string | null {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path.includes('?') || path.includes('#') || !integer(step) || !id || id.length > 512) return null;
  try {
    const url = new URL(path, origin);
    if (url.origin !== origin || url.pathname !== path) return null;
    url.searchParams.set('preview', '1');
    url.searchParams.set('step', String(step));
    url.hash = encodeURIComponent(id);
    return url.href;
  } catch { return null; }
}

export function isRoom(value: string): boolean { return /^[a-f0-9]{32}$/.test(value); }

export function presenterKeyAction(key: string, context: { editing: boolean; interactive: boolean; modified: boolean }):
  'next' | 'previous' | 'home' | 'notes' | 'map' | undefined {
  if (context.editing || context.modified) return undefined;
  if (key.toLowerCase() === 'g') return 'map';
  if (key.toLowerCase() === 'n') return 'notes';
  if (key === ' ' && context.interactive) return undefined;
  if (key === ' ' || key === 'ArrowRight' || key === 'ArrowDown' || key === 'PageDown') return 'next';
  if (key === 'ArrowLeft' || key === 'ArrowUp' || key === 'PageUp') return 'previous';
  if (key === 'Home') return 'home';
  return undefined;
}
