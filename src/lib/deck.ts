export type DeckReference = `docs/${string}` | `news/${string}`;

export interface PresentationConfig {
  readonly sections: readonly {
    readonly name: string;
    readonly items: readonly DeckReference[];
  }[];
}

export interface DeckEntry {
  reference: DeckReference;
  section: string;
  draft: boolean;
}

export function selectDeck<T extends DeckEntry>(
  entries: readonly T[],
  presentation?: PresentationConfig,
): T[] {
  if (!presentation) return entries.filter((entry) => !entry.draft);

  const byReference = new Map(entries.map((entry) => [entry.reference, entry]));
  const names = new Set<string>();
  const references = new Set<string>();
  const selected: T[] = [];

  for (const section of presentation.sections) {
    const name = section.name.trim();
    if (!name) throw new Error('Presentation section names must not be empty.');
    if (names.has(name)) throw new Error(`Duplicate presentation section: ${name}`);
    names.add(name);
    for (const reference of section.items) {
      if (references.has(reference)) throw new Error(`Duplicate presentation reference: ${reference}`);
      references.add(reference);
      const entry = byReference.get(reference);
      if (!entry) throw new Error(`Unknown presentation reference: ${reference}`);
      if (!entry.draft) selected.push({ ...entry, section: name });
    }
  }
  return selected;
}
