import { constants, copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function initializeBrief(root: string): 'created' | 'exists' {
  const destination = join(root, 'sources', 'workflows', 'brief.md');
  mkdirSync(dirname(destination), { recursive: true });
  try {
    copyFileSync(join(root, 'templates', 'brief.md'), destination, constants.COPYFILE_EXCL);
    return 'created';
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') return 'exists';
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const result = initializeBrief(root);
  console.log(result === 'created'
    ? 'Created sources/workflows/brief.md. Fill it in before preparing your outline.'
    : 'sources/workflows/brief.md already exists; it was not changed.');
}
