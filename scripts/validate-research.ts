import { readFileSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseContent } from './validate-content';
import { inventorySources, checkSourceRefs } from './source-inventory';
import { validAttributionUrl } from '../src/lib/content-image';

const root = fileURLToPath(new URL('..', import.meta.url));
const url = (value: unknown) => typeof value === 'string' && validAttributionUrl(value);
const nonempty = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const validDate = (value: unknown) => value instanceof Date && !Number.isNaN(value.valueOf());
const publishedDate = (value: unknown) => {
  if (validDate(value)) return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
};
const retrievedDate = (value: unknown) => validDate(value) ||
  (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/i.test(value) && !Number.isNaN(Date.parse(value)));

export function validateResearch(text: string): string[] {
  const { data, body, error } = parseContent(text);
  if (error) return [error];
  const errors: string[] = [];
  for (const field of ['id', 'topic', 'title', 'publisher']) if (!nonempty(data[field])) errors.push(`${field} is required`);
  if (!url(data.url)) errors.push('url must be HTTP(S)');
  if (data.published != null && !publishedDate(data.published)) errors.push('published must be a calendar date or null');
  if (!retrievedDate(data.retrieved)) errors.push('retrieved must be a timestamp with timezone');
  if (!['pending', 'reviewed', 'blocked'].includes(String(data.review))) errors.push('review must be pending, reviewed or blocked');
  if (!body.trim()) errors.push('research body is required');
  if (!Array.isArray(data.claims) || data.claims.length === 0) errors.push('at least one claim is required');
  else for (const claim of data.claims) {
    if (!claim || typeof claim !== 'object' || !nonempty(claim.text) || !Array.isArray(claim.sources) || !claim.sources.length || !claim.sources.every(url)) errors.push('each claim needs text and HTTP(S) sources');
  }
  if (data.images !== undefined && !Array.isArray(data.images)) errors.push('images must be an array');
  else for (const image of (data.images as unknown[] | undefined) ?? []) {
    if (!image || typeof image !== 'object') { errors.push('invalid image candidate'); continue; }
    const item = image as Record<string, unknown>;
    if (!url(item.source)) errors.push('image candidate requires an HTTP(S) source');
    if (item.approved === true && (!nonempty(item.creator) || !nonempty(item.credit) || !nonempty(item.alt) || !url(item.permission))) {
      errors.push('approved image requires creator, credit, alt and permission URL');
    }
    if (item.approved !== undefined && typeof item.approved !== 'boolean') errors.push('image approved must be boolean');
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] ?? 'sources/news';
  const inventory = inventorySources(root, dir);
  const errors = [...inventory.errors];
  if (!inventory.files.length && !inventory.errors.length) errors.push(`${dir}: no research records found`);
  for (const file of inventory.files) {
    if (!file.path.endsWith('.md')) { errors.push(`${file.path}: expected Markdown research record`); continue; }
    errors.push(...validateResearch(readFileSync(join(root, file.path), 'utf8')).map((e) => `${file.path}: ${e}`));
  }
  // Optional handoff references are machine-checkable source references.
  const refsPath = process.argv[3];
  if (refsPath) {
    try {
      const path = resolve(root, refsPath);
      if (relative(root, path).startsWith('..') || !relative(root, path)) throw new Error('handoff must be inside project');
      const refs = JSON.parse(readFileSync(path, 'utf8'));
      errors.push(...checkSourceRefs(refs, inventory.files));
    } catch (error) { errors.push(`handoff references: ${error instanceof Error ? error.message : 'unavailable'}`); }
  }
  for (const error of errors) console.error(`error ${error}`);
  if (errors.length) process.exitCode = 1;
  else console.log(`research: valid (${inventory.files.length} records); metadata checks do not verify facts`);
}
