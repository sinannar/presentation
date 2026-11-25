import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';

export interface SourceFile {
  path: string;
  lines: number;
  sha256: string;
}

export function inventorySources(root: string, sourceDir: string): { files: SourceFile[]; errors: string[] } {
  const files: SourceFile[] = [];
  const errors: string[] = [];
  const base = resolve(root);
  const directory = resolve(base, sourceDir);
  const local = relative(base, directory);
  // Generated workflow metadata and private working assets are not evidence.
  const excludePaths = local === 'sources' ? ['sources/workflows', 'sources/private/assets', 'sources/private/workflows'] : [];
  if (!local || local.startsWith(`..${sep}`) || local === '..' || isAbsolute(local)) {
    return { files, errors: ['source directory must be inside the project'] };
  }
  // Refuse symlinks in every directory component, including the selected root.
  let component = base;
  try {
    for (const part of local.split(sep)) {
      component = resolve(component, part);
      if (lstatSync(component).isSymbolicLink()) return { files, errors: [`${local}: symlink is not allowed`] };
    }
    if (!lstatSync(directory).isDirectory()) return { files, errors: [`${local}: not a directory`] };
  } catch {
    return { files, errors: [`${local}: source directory is unavailable`] };
  }
  function walk(dir: string): void {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0); }
    catch { errors.push(`${relative(base, dir)}: cannot read directory`); return; }
    for (const entry of entries) {
      const path = resolve(dir, entry.name);
      const name = relative(base, path).split(sep).join('/');
      if (entry.name === '.gitkeep' && entry.isFile()) continue;
      if (/[\x00-\x1f\x7f]/.test(name)) { errors.push('source path contains control characters'); continue; }
      if (entry.isSymbolicLink()) { errors.push(`${name}: symlink is not allowed`); continue; }
      if (entry.isDirectory()) {
        if (!excludePaths.includes(name)) walk(path);
        continue;
      }
      if (!entry.isFile() || !/\.(md|txt)$/i.test(entry.name)) { errors.push(`${name}: unsupported file`); continue; }
      try {
        const bytes = readFileSync(path);
        const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text)) { errors.push(`${name}: binary or unsupported control characters`); continue; }
        const lines = text.length === 0 ? 0 : text.split(/\r\n|\r|\n/).length - (/(?:\r\n|\r|\n)$/.test(text) ? 1 : 0);
        files.push({ path: name, lines, sha256: createHash('sha256').update(bytes).digest('hex') });
      } catch (error) {
        errors.push(`${name}: ${error instanceof TypeError ? 'invalid UTF-8' : 'cannot read file'}`);
      }
    }
  }
  walk(directory);
  return { files, errors };
}

export function sourceRef(file: SourceFile): string {
  return `${file.path}#L1-L${file.lines}@sha256:${file.sha256}`;
}

export function checkSourceRefs(refs: unknown, files: SourceFile[]): string[] {
  if (refs === undefined) return [];
  if (!Array.isArray(refs) || refs.some((ref) => typeof ref !== 'string')) return ['sourceRefs must be an array of strings'];
  const lookup = new Map(files.map((file) => [file.path, file]));
  return refs.flatMap((ref: string) => {
    const match = /^(.*?)#L([1-9]\d*)-L([1-9]\d*)@sha256:([a-f0-9]{64})$/.exec(ref);
    if (!match) return ['invalid source reference (expected path#L1-L2@sha256:<hash>)'];
    const file = lookup.get(match[1]);
    if (!file) return [`${match[1]}: source reference not found in inventory`];
    if (Number(match[2]) > Number(match[3]) || Number(match[3]) > file.lines) return [`${match[1]}: source range is out of bounds`];
    if (match[4] !== file.sha256) return [`${match[1]}: source hash is stale`];
    return [];
  });
}
