import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const errors: string[] = [];
const roles = ['source-researcher', 'outline-planner', 'presentation-editor', 'publication-reviewer', 'news-agent'];
const skills = ['source-grounding', 'web-research', 'source-news-review', 'outline-approval', 'markdown-authoring', 'keynote-customization', 'publication-boundaries', 'asset-validation', 'news-orchestration'];
const required = [
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  'package.json',
  'scripts/validate-research.ts',
  'scripts/validate-news-run.ts',
  'templates/news-run-state.json',
  'templates/research-brief.md',
  'templates/source-news.md',
  'templates/research-review.md',
  'templates/workflow-handoff.md',
  '.github/copilot-instructions.md',
  'docs/agents-and-skills.md',
  'docs/agent-compatibility.md',
  ...roles.flatMap((name) => [
    `.github/agents/${name}.agent.md`, `.agents/roles/${name}.md`,
    `.claude/agents/${name}.md`, `.cursor/agents/${name}.md`,
    `.opencode/agents/${name}.md`, `.codex/agents/${name}.toml`,
  ]),
  ...skills.flatMap((name) => [`.agents/skills/${name}/SKILL.md`, `.claude/skills/${name}/SKILL.md`]),
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
const manifestPath = join(root, 'package.json');
if (existsSync(manifestPath)) {
  try {
    const scripts = JSON.parse(text(manifestPath)).scripts as Record<string, unknown> | undefined;
    if (typeof scripts?.['validate:research'] !== 'string' || !scripts['validate:research'].includes('scripts/validate-research.ts')) {
      errors.push('package.json: validate:research must run scripts/validate-research.ts');
    }
  } catch {
    errors.push('package.json: invalid JSON');
  }
}
const claudeInstructions = join(root, 'CLAUDE.md');
if (existsSync(claudeInstructions) && !text(claudeInstructions).includes('@AGENTS.md')) {
  errors.push('CLAUDE.md: missing AGENTS.md import');
}

for (const name of roles) {
  const agent = join(root, '.github/agents', `${name}.agent.md`);
  const role = join(root, '.agents/roles', `${name}.md`);
  if (existsSync(agent)) checkFrontmatter(agent, ['name', 'description']);
  if (existsSync(role)) checkFrontmatter(role, ['role', 'portable']);
  for (const host of ['.github', '.claude', '.cursor', '.opencode', '.codex']) {
    const extension = host === '.github' ? '.agent.md' : host === '.codex' ? '.toml' : '.md';
    const path = join(root, host, 'agents', `${name}${extension}`);
    if (!existsSync(path)) continue;
    const content = text(path);
    if (host === '.codex') {
      for (const field of ['name', 'description', 'developer_instructions']) {
        if (!new RegExp(`^${field}\\s*=\\s*".+"`, 'm').test(content)) errors.push(`${display(path)}: missing ${field}`);
      }
    } else {
      checkFrontmatter(path, host === '.opencode' ? ['description', 'mode'] : ['name', 'description']);
    }
    if (!content.includes(`.agents/roles/${name}.md`)) errors.push(`${display(path)}: missing matching role reference`);
  }
}
for (const entry of readdirSync(join(root, '.agents/skills'))) {
  const path = join(root, '.agents/skills', entry, 'SKILL.md');
  if (statSync(join(root, '.agents/skills', entry)).isDirectory() && existsSync(path)) {
    checkFrontmatter(path, ['name', 'description']);
  }
}
for (const name of skills) {
  const canonical = join(root, '.agents/skills', name, 'SKILL.md');
  const adapter = join(root, '.claude/skills', name, 'SKILL.md');
  if (!existsSync(canonical) || !existsSync(adapter)) continue;
  checkFrontmatter(adapter, ['name', 'description']);
  const getField = (path: string, field: string) => frontmatter(path)?.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))?.[1];
  if (getField(adapter, 'name') !== name || getField(canonical, 'name') !== name) errors.push(`${display(adapter)}: skill name mismatch`);
  if (getField(adapter, 'description') !== getField(canonical, 'description')) errors.push(`${display(adapter)}: description differs from canonical skill`);
  if (!text(adapter).includes(`.agents/skills/${name}/SKILL.md`)) errors.push(`${display(adapter)}: missing matching skill reference`);
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
