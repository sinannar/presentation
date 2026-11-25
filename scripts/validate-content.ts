import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const errors: string[] = [];
for (const collection of ['docs', 'news']) {
  const dir = join(root, 'src', 'content', collection);
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    const text = readFileSync(join(dir, file), 'utf8');
    if (!text.startsWith('---\n')) errors.push(`${relative(root, join(dir, file))}: missing frontmatter`);
    if (text.includes('TODO')) errors.push(`${relative(root, join(dir, file))}: contains TODO`);
  }
}
if (errors.length) { for (const error of errors) console.error(`error ${error}`); process.exit(1); }
console.log('content: valid');
