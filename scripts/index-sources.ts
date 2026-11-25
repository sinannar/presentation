import { fileURLToPath } from 'node:url';
import { inventorySources, sourceRef } from './source-inventory';
import { checkContentRefs } from './validate-content';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
let sourceDir = 'sources';
let checkRefs = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--source-dir' && args[i + 1] && !args[i + 1].startsWith('--')) sourceDir = args[++i];
  else if (args[i] === '--check-refs') checkRefs = true;
  else { console.error('usage: npm run validate:sources -- [--source-dir <project directory>] [--check-refs]'); process.exit(1); }
}
const { files, errors } = inventorySources(root, sourceDir);
console.log(`sources: ${files.length} Markdown/TXT file(s)`);
for (const file of files) console.log(file.lines ? sourceRef(file) : `${file.path}: empty (sha256:${file.sha256})`);
if (checkRefs) errors.push(...checkContentRefs(root, files));
for (const error of errors) console.error(`error ${error}`);
if (errors.length) process.exitCode = 1;
