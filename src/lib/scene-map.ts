export interface SceneMapEntry {
  id: string;
  index: number;
  title: string;
  kind: string;
  section: string;
  summary: string;
  featured: boolean;
  steps: string[];
}

export interface SceneMapGroup {
  section: string;
  entries: SceneMapEntry[];
}

export interface SceneMapVisibility {
  scenes: Set<string>;
  sections: Set<string>;
}

export function sceneMapSection(entry: SceneMapEntry): string {
  return entry.section.trim() || 'Presentation';
}

/** Storage is optional: blocked or corrupt localStorage must not break the map. */
export function readSceneMapVisibility(storage: Storage | undefined, key: string): SceneMapVisibility {
  const empty = (): SceneMapVisibility => ({ scenes: new Set(), sections: new Set() });
  try {
    const data: unknown = JSON.parse(storage?.getItem(key) || 'null');
    if (!data || typeof data !== 'object') return empty();
    const { scenes, sections } = data as Record<string, unknown>;
    return {
      scenes: new Set(Array.isArray(scenes) ? scenes.filter((item): item is string => typeof item === 'string') : []),
      sections: new Set(Array.isArray(sections) ? sections.filter((item): item is string => typeof item === 'string') : []),
    };
  } catch {
    return empty();
  }
}

export function writeSceneMapVisibility(storage: Storage | undefined, key: string, visibility: SceneMapVisibility): void {
  try {
    storage?.setItem(key, JSON.stringify({ scenes: [...visibility.scenes], sections: [...visibility.sections] }));
  } catch {
    // Keep the in-memory preference when storage is unavailable or full.
  }
}

const normalize = (value: string) =>
  value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

/** Match every query word across title, section and summary, ignoring accents. */
export function searchSceneMap(entries: readonly SceneMapEntry[], query: string): SceneMapEntry[] {
  const words = normalize(query).split(/\s+/u).filter(Boolean);
  return entries.filter((entry) => {
    const text = normalize(`${entry.title} ${entry.section} ${entry.summary}`);
    return words.every((word) => text.includes(word));
  });
}

/** Preserve first-seen section order and original navigation indices. */
export function groupSceneMap(entries: readonly SceneMapEntry[]): SceneMapGroup[] {
  const groups = new Map<string, SceneMapGroup>();
  for (const entry of entries) {
    const section = sceneMapSection(entry);
    let group = groups.get(section);
    if (!group) {
      group = { section, entries: [] };
      groups.set(section, group);
    }
    group.entries.push(entry);
  }
  return [...groups.values()];
}
