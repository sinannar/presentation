import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { checkSourceRefs, type SourceFile } from './source-inventory';
import { imageIssues } from '../src/lib/content-image';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml') as { load: (text: string) => unknown };
const root = fileURLToPath(new URL('..', import.meta.url));
const markdown = unified().use(remarkParse).use(remarkGfm);

type Node = { type: string; url?: string; children?: Node[]; position?: { start: { line: number } } };

function safeUrl(url: string): boolean {
  // Browsers discard ASCII controls in schemes and interpret backslashes as slashes.
  if (/[\x00-\x20\x7f\\]/.test(url)) return false;
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(url);
  return !scheme || /^(https?|mailto)$/i.test(scheme[1]);
}

export function parseContent(text: string): { data: Record<string, unknown>; body: string; error?: string } {
  const match = /^(?:\uFEFF)?---\s*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (!match) return { data: {}, body: text, error: 'missing or unclosed frontmatter' };
  try {
    const data = yaml.load(match[1]);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { data: {}, body: '', error: 'frontmatter must be a mapping' };
    return { data: data as Record<string, unknown>, body: text.slice(match[0].length) };
  } catch { return { data: {}, body: '', error: 'invalid frontmatter' }; }
}

export function validateMarkdown(text: string): string[] {
  const { data, body, error } = parseContent(text);
  if (error) return [error];
  const errors: string[] = [];
  if (text.includes('TODO')) errors.push('contains TODO');
  if (data.image !== undefined) {
    for (const issue of imageIssues(data.image)) errors.push(`image.${issue.field}: ${issue.message}`);
  }
  if (Array.isArray(data.links)) {
    for (const link of data.links) {
      if (link && typeof link === 'object' && 'url' in link && (typeof link.url !== 'string' || !safeUrl(link.url))) errors.push('unsafe frontmatter link URL');
    }
  }
  function visit(node: Node): void {
    if (node.type === 'html') errors.push(`raw HTML is not allowed (body line ${node.position?.start.line ?? '?'})`);
    if ((node.type === 'link' || node.type === 'image' || node.type === 'definition') && node.url !== undefined && !safeUrl(node.url)) {
      errors.push(`unsafe Markdown URL (body line ${node.position?.start.line ?? '?'})`);
    }
    node.children?.forEach(visit);
  }
  visit(markdown.parse(body) as Node);
  return errors;
}

function contentFiles(projectRoot: string): string[] {
  const files: string[] = [];
  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && /\.md$/i.test(entry.name)) files.push(path);
    }
  }
  for (const collection of ['docs', 'news']) walk(join(projectRoot, 'src', 'content', collection));
  return files;
}

export function checkContentRefs(projectRoot: string, files: SourceFile[]): string[] {
  return contentFiles(projectRoot).flatMap((file) => {
    const parsed = parseContent(readFileSync(file, 'utf8'));
    return (parsed.error ? [parsed.error] : checkSourceRefs(parsed.data.sourceRefs, files)).map((error) => `${relative(projectRoot, file)}: ${error}`);
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = contentFiles(root).flatMap((file) => validateMarkdown(readFileSync(file, 'utf8')).map((error) => `${relative(root, file)}: ${error}`));
  for (const error of errors) console.error(`error ${error}`);
  if (errors.length) process.exitCode = 1;
  else console.log('content: valid');
}
