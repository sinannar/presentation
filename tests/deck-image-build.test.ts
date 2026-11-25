import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

test('selected scenes and attributed news images build under a project base without leaking drafts', () => {
  const root = mkdtempSync(join(tmpdir(), 'presentation build '));
  const project = resolve('.');
  try {
    for (const path of ['src', 'scripts', 'site.config.ts', 'astro.config.mjs', 'tsconfig.json', 'package.json']) {
      cpSync(join(project, path), join(root, path), { recursive: true });
    }
    if (existsSync(join(project, 'public'))) cpSync(join(project, 'public'), join(root, 'public'), { recursive: true });
    symlinkSync(join(project, 'node_modules'), join(root, 'node_modules'), 'junction');
    mkdirSync(join(root, 'public/images'), { recursive: true });
    cpSync(join(project, 'tests/fixtures/content-image/public/images/nested/pixel.png'), join(root, 'public/images/pixel.png'));
    const news = join(root, 'src/content/news/template-workflow.md');
    const image = 'image:\n  src: /images/pixel.png\n  alt: Example pixel\n  credit: Example creator\n  sourceUrl: https://example.com/image\n  licenseUrl: https://example.com/license\n';
    writeFileSync(news, readFileSync(news, 'utf8').replace('---\ntitle:', `---\n${image}title:`));
    writeFileSync(join(root, 'src/content/news/unpublished.md'), '---\ntitle: Secret draft marker\nsummary: Hidden\ncategory: Test\npublished: 2026-01-01\ndraft: true\n---\nHidden\n');
    const config = join(root, 'site.config.ts');
    writeFileSync(config, readFileSync(config, 'utf8').replace("  sections: [", "  presentation: { sections: [{ name: 'Selected', items: ['news/template-workflow', 'news/unpublished', 'docs/getting-started'] }] },\n  sections: ["));
    const result = spawnSync('npm', ['run', 'build'], {
      cwd: root, encoding: 'utf8', env: { ...process.env, ASTRO_BASE: '/sample-presentation/', ASTRO_TELEMETRY_DISABLED: '1' }, timeout: 120000,
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const html = readFileSync(join(root, 'dist/index.html'), 'utf8');
    const newsIndex = html.indexOf('data-scene="news-template-workflow"');
    const docsIndex = html.indexOf('data-scene="docs-getting-started"');
    assert.ok(newsIndex >= 0 && docsIndex > newsIndex);
    assert.doesNotMatch(html, /data-scene="docs-make-it-yours"|Secret draft marker/);
    for (const file of ['dist/index.html', 'dist/news/template-workflow/index.html']) {
      const page = readFileSync(join(root, file), 'utf8');
      assert.match(page, /src="\/sample-presentation\/images\/pixel\.png"/);
      assert.match(page, /Example creator/);
      assert.match(page, /https:\/\/example\.com\/license/);
    }
    assert.match(readFileSync(join(root, 'dist/docs/index.html'), 'utf8'), /\/sample-presentation\/docs\/make-it-yours\//);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
