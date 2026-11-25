import { closeSync, openSync, readSync, realpathSync, statSync } from 'node:fs';
import { extname, isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ContentImage {
  src: string;
  alt: string;
  credit: string;
  sourceUrl: string;
  licenseUrl: string;
}

type ImageIssue = { field: keyof ContentImage; message: string };
const projectRoot = fileURLToPath(new URL('../..', import.meta.url));

function inside(parent: string, child: string): boolean {
  const path = relative(parent, child);
  return path !== '' && path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

function rasterMatches(path: string): boolean {
  const fd = openSync(path, 'r');
  const bytes = Buffer.alloc(64);
  let length: number;
  try { length = readSync(fd, bytes, 0, bytes.length, 0); }
  finally { closeSync(fd); }
  const header = bytes.subarray(0, length);
  const ext = extname(path).toLowerCase();
  if (ext === '.png') return header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (ext === '.jpg' || ext === '.jpeg') return length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (ext === '.gif') return ['GIF87a', 'GIF89a'].includes(header.toString('ascii', 0, 6));
  if (ext === '.webp') return length >= 12 && header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP';
  if (ext === '.avif') {
    if (length < 16 || header.toString('ascii', 4, 8) !== 'ftyp') return false;
    const boxLength = header.readUInt32BE(0);
    if (boxLength < 16) return false;
    return ['avif', 'avis'].includes(header.toString('ascii', 8, 12)) ||
      Array.from({ length: Math.floor((Math.min(length, boxLength) - 16) / 4) }, (_, index) => header.toString('ascii', 16 + index * 4, 20 + index * 4)).some((brand) => brand === 'avif' || brand === 'avis');
  }
  return false;
}

export function validImagePath(src: string, root = projectRoot): boolean {
  if (!src.startsWith('/images/') || /[%?#\\:\x00-\x1f\x7f]/.test(src)) return false;
  const segments = src.slice('/images/'.length).split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) return false;
  if (!/\.(?:png|jpe?g|gif|webp|avif)$/i.test(src)) return false;
  try {
    const expectedPublicRoot = join(realpathSync(root), 'public');
    const publicRoot = realpathSync(expectedPublicRoot);
    const imagesRoot = realpathSync(join(publicRoot, 'images'));
    const image = realpathSync(join(imagesRoot, ...segments));
    return publicRoot === expectedPublicRoot && imagesRoot === join(publicRoot, 'images') &&
      inside(imagesRoot, image) && statSync(image).isFile() && rasterMatches(image);
  } catch {
    return false;
  }
}

export function validAttributionUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value) || /[\x00-\x20\x7f\\]/.test(value)) return false;
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function imageIssues(value: unknown, root = projectRoot): ImageIssue[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [{ field: 'src', message: 'image must be an object with src, alt, credit, sourceUrl and licenseUrl' }];
  }
  const image = value as Record<string, unknown>;
  const issues: ImageIssue[] = [];
  if (typeof image.src !== 'string' || !validImagePath(image.src, root)) {
    issues.push({ field: 'src', message: 'must be an existing raster file under public/images using a plain /images/ path' });
  }
  for (const field of ['alt', 'credit'] as const) {
    if (typeof image[field] !== 'string' || !image[field].trim()) issues.push({ field, message: 'must be nonempty text' });
  }
  for (const field of ['sourceUrl', 'licenseUrl'] as const) {
    if (typeof image[field] !== 'string' || !validAttributionUrl(image[field])) issues.push({ field, message: 'must be an absolute HTTP(S) URL' });
  }
  return issues;
}
