import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const errors: string[] = [];
const required = [
  'AGENTS.md',
  '.github/copilot-instructions.md',
  'docs/agents-and-skills.md',
  ...['source-researcher', 'outline-planner', 'presentation-editor', 'publication-reviewer']
    .map((name) => `.github/agents/${name}.agent.md`),
  ...['source-researcher', 'outline-planner', 'presentation-editor', 'publication-reviewer']
    .map((name) => `.agents/roles/${name}.md`),
  ...['source-grounding', 'outline-approval', 'markdown-authoring', 'publication-boundaries', 'asset-validation']
    .map((name) => `.agents/skills/${name}/SKILL.md`),
];

function display(path: string) { return relative(root, path) || '.'; }
function text(path: string) { return readFileSync(path, 'utf8'); }
function frontmatter(path: string): string | undefined {
  const value = text(path);
  if (!value.startsWith('---\n')) return undefined;
  const end = value.indexOf('\n---', 4);
  return end < 0 ? undefined : value.slice(4, end);
}
function checkFrontmatter(path: string, fields: string[]) {
  const header = frontmatter(path);
  if (!header) { errors.push(`${display(path)}: missing or unterminated frontmatter`); return; }
  for (const field of fields) if (!new RegExp(`^${field}:\\s*\\S`, 'm').test(header)) {
    errors.push(`${display(path)}: frontmatter missing ${field}`);
  }
}

for (const path of required.map((file) => join(root, file))) {
  if (!existsSync(path)) errors.push(`${display(path)}: required file is missing`);
}

for (const name of ['source-researcher', 'outline-planner', 'presentation-editor', 'publication-reviewer']) {
  const agent = join(root, '.github/agents', `${name}.agent.md`);
  const role = join(root, '.agents/roles', `${name}.md`);
  if (existsSync(agent)) checkFrontmatter(agent, ['name', 'description']);
  if (existsSync(role)) checkFrontmatter(role, ['role', 'portable']);
}
for (const entry of readdirSync(join(root, '.agents/skills'))) {
  const path = join(root, '.agents/skills', entry, 'SKILL.md');
  if (statSync(join(root, '.agents/skills', entry)).isDirectory() && existsSync(path)) {
    checkFrontmatter(path, ['name', 'description']);
  }
}

const markdown = required.map((file) => join(root, file)).filter(existsSync);
for (const file of markdown) {
  for (const match of text(file).matchAll(/\]\(([^)#?]+)(?:#[^)]*)?\)/g)) {
    const target = match[1];
    if (/^(?:[a-z]+:|\/\/)/i.test(target)) continue;
    const resolved = resolve(join(file, '..'), target);
    if (!existsSync(resolved)) errors.push(`${display(file)}: referenced path does not exist: ${target}`);
  }
}

if (errors.length) {
  for (const error of errors) console.error(`error ${error}`);
  process.exit(1);
}
console.log(`agent assets: valid (${required.length} required files)`);
