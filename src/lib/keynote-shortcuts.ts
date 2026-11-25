export function keynoteShortcut(
  key: string,
  options: { dialogOpen: boolean; modified: boolean; editing: boolean; interactive: boolean },
): 'next' | 'previous' | 'home' | 'help' | 'fullscreen' | 'remote' | undefined {
  if (options.dialogOpen || options.modified || options.editing) return;
  switch (key) {
    case 'ArrowRight': return 'next';
    case ' ': return options.interactive ? undefined : 'next';
    case 'ArrowLeft': return 'previous';
    case 'Home': return 'home';
    case '?': return 'help';
    case 'f':
    case 'F': return 'fullscreen';
    case 'r':
    case 'R': return 'remote';
  }
}
