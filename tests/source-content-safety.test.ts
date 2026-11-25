import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { validateMarkdown } from '../scripts/validate-content';

const page = (body: string, extra = '') => `---\ntitle: Example\n${extra}---\n${body}\n`;

test('allows Markdown autolinks and code examples but rejects actual raw HTML', () => {
  assert.deepEqual(validateMarkdown(page('<https://example.com> <user@example.com>\n\n`<script>`\n\n```html\n<b>example</b>\n```')), []);
  assert.match(validateMarkdown(page('Hello <b>world</b>'))[0], /raw HTML/);
  assert.match(validateMarkdown(page('<!-- comment -->'))[0], /raw HTML/);
});

test('rejects unsafe inline, reference, image, entity-encoded and frontmatter URLs', () => {
  for (const body of [
    '[link](javascript:alert)',
    '[link][unsafe]\n\n[unsafe]: javascript:alert',
    '![image](data:image/svg+xml,test)',
    '[link](javascript&#58;alert)',
    '[link](<java&#x09;script:alert>)',
  ]) {
    assert.ok(validateMarkdown(page(body)).some((error) => error.includes('unsafe Markdown URL')), body);
  }
  assert.ok(validateMarkdown(page('safe', 'links:\n  - label: Bad\n    url: javascript:alert\n')).some((error) => error.includes('unsafe frontmatter')));
  assert.deepEqual(validateMarkdown(page('[safe](/docs/) [mail](mailto:a@example.com) [web](https://example.com)')), []);
});
