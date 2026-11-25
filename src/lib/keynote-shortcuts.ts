export function keynoteShortcut(
  key: string,
  options: { dialogOpen: boolean; modified: boolean; editing: boolean; interactive: boolean; shift?: boolean },
): 'next' | 'previous' | 'next-scene' | 'previous-scene' | 'home' | 'help' |
  'fullscreen' | 'remote' | 'map' | 'presenter' | 'notes' | 'details' | 'highlights' |
  'hide-controls' | 'blackout' | 'skip-reveals' | 'section' | undefined {
  if (options.dialogOpen || options.modified || options.editing) return;
  switch (key) {
    case 'ArrowRight':
    case 'PageDown': return options.shift ? 'next-scene' : 'next';
    case ' ': return options.interactive ? undefined : 'next';
    case 'ArrowLeft':
    case 'PageUp': return options.shift ? 'previous-scene' : 'previous';
    case 'Home': return 'home';
    case '?': return 'help';
    case 'f':
    case 'F': return 'fullscreen';
    case 'r':
    case 'R': return 'remote';
    case 'm':
    case 'M':
    case 'g':
    case 'G': return 'map';
    case 'p':
    case 'P': return 'presenter';
    case 'n':
    case 'N': return 'notes';
    case 'e':
    case 'E': return 'details';
    case 't':
    case 'T': return 'highlights';
    case 'h':
    case 'H': return 'hide-controls';
    case 'b':
    case 'B': return 'blackout';
    case 's':
    case 'S': return 'skip-reveals';
  }
  if (/^[1-9]$/.test(key)) return 'section';
}
