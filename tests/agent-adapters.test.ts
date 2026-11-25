import { strict as assert } from 'node:assert';
import { cpSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

test('agent asset validation handles spaces and detects broken adapters', () => {
  const project = resolve('.');
  const root = mkdtempSync(join(tmpdir(), 'presentation agent adapters '));
  try {
    for (const path of ['AGENTS.md', 'CLAUDE.md', 'README.md', 'CONTRIBUTING.md', 'package.json', 'templates', 'docs', 'scripts', '.agents', '.github', '.claude', '.cursor', '.opencode', '.codex']) {
      cpSync(join(project, path), join(root, path), { recursive: true });
    }
    const validate = () => spawnSync(process.execPath, ['--import', 'tsx', join(root, 'scripts/validate-agent-assets.ts')], {
      cwd: project, encoding: 'utf8',
    });
    const valid = validate();
    assert.equal(valid.status, 0, valid.stderr);

    const skill = join(root, '.claude/skills/source-grounding/SKILL.md');
    const original = readFileSync(skill, 'utf8');
    writeFileSync(skill, original.replace('.agents/skills/source-grounding/SKILL.md', '.agents/skills/wrong/SKILL.md'));
    const broken = validate();
    assert.notEqual(broken.status, 0);
    assert.match(broken.stderr, /missing matching skill reference/);
    writeFileSync(skill, original);

    unlinkSync(join(root, '.codex/agents/publication-reviewer.toml'));
    const missing = validate();
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /publication-reviewer\.toml: required file is missing/);

    unlinkSync(join(root, '.claude/skills/source-news-review/SKILL.md'));
    const skillAdapter = validate();
    assert.notEqual(skillAdapter.status, 0);
    assert.match(skillAdapter.stderr, /source-news-review\/SKILL\.md: required file is missing/);

    writeFileSync(join(root, 'CLAUDE.md'), 'No import\n');
    const instructions = validate();
    assert.notEqual(instructions.status, 0);
    assert.match(instructions.stderr, /CLAUDE\.md: missing AGENTS\.md import/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('manual and autopilot workflow adapters are required', () => {
  const project = resolve('.');
  const root = mkdtempSync(join(tmpdir(), 'presentation agent coverage '));
  try {
    for (const path of ['AGENTS.md', 'CLAUDE.md', 'README.md', 'CONTRIBUTING.md', 'package.json', 'templates', 'docs', 'scripts', '.agents', '.github', '.claude', '.cursor', '.opencode', '.codex']) {
      cpSync(join(project, path), join(root, path), { recursive: true });
    }
    const reviewer = join(root, '.cursor/agents/publication-reviewer.md');
    unlinkSync(reviewer);
    const broken = spawnSync(process.execPath, ['--import', 'tsx', join(root, 'scripts/validate-agent-assets.ts')], {
      cwd: project, encoding: 'utf8',
    });
    assert.notEqual(broken.status, 0);
    assert.match(broken.stderr, /publication-reviewer\.md: required file is missing/);
    unlinkSync(join(root, '.github/agents/news-agent.agent.md'));
    unlinkSync(join(root, '.claude/skills/news-orchestration/SKILL.md'));
    const autopilot = spawnSync(process.execPath, ['--import', 'tsx', join(root, 'scripts/validate-agent-assets.ts')], {
      cwd: project, encoding: 'utf8',
    });
    assert.notEqual(autopilot.status, 0);
    assert.match(autopilot.stderr, /news-agent\.agent\.md: required file is missing/);
    assert.match(autopilot.stderr, /news-orchestration\/SKILL\.md: required file is missing/);
    assert.match(readFileSync(join(root, '.opencode/agents/news-agent.md'), 'utf8'), /^mode: (?:all|primary)$/m);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
