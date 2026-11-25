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
    const section = entry.section.trim() || 'Presentation';
    let group = groups.get(section);
    if (!group) {
      group = { section, entries: [] };
      groups.set(section, group);
    }
    group.entries.push(entry);
  }
  return [...groups.values()];
}
