import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const names = ['research', 'verify', 'outline', 'edit', 'finalize'] as const;
const root = fileURLToPath(new URL('..', import.meta.url));
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function artifactErrors(value: unknown, projectRoot: string, label: string): string[] {
  if (!Array.isArray(value)) return [`${label}: expected artifact array`];
  const errors: string[] = [];
  for (const artifact of value) {
    if (!object(artifact) || !text(artifact.path) || typeof artifact.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(artifact.sha256)) {
      errors.push(`${label}: artifact requires path and sha256`); continue;
    }
    const path = resolve(projectRoot, artifact.path);
    const local = relative(projectRoot, path);
    if (!local || local === '..' || local.startsWith(`..${sep}`) || isAbsolute(local) || isAbsolute(artifact.path)) {
      errors.push(`${label}: path must be inside project`); continue;
    }
    try {
      let part = projectRoot;
      for (const component of local.split(sep)) {
        part = resolve(part, component);
        if (lstatSync(part).isSymbolicLink()) throw new Error('symlink not allowed');
      }
      if (!lstatSync(path).isFile() || relative(realpathSync(projectRoot), realpathSync(path)).startsWith(`..${sep}`)) throw new Error('invalid path');
      const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
      if (actual !== artifact.sha256) errors.push(`${label}: stale ${artifact.path}`);
    } catch { errors.push(`${label}: unavailable or unsafe ${artifact.path}`); }
  }
  return errors;
}

export function validateNewsRun(value: unknown, projectRoot: string): string[] {
  if (!object(value)) return ['run state must be an object'];
  const errors: string[] = [];
  if (value.version !== 1) errors.push('version must be 1');
  for (const field of ['runId', 'topic', 'request']) if (!text(value[field])) errors.push(`${field} is required`);
  if (value.mode !== 'autopilot') errors.push('mode must be autopilot');
  if (typeof value.commitOptIn !== 'boolean') errors.push('commitOptIn must be boolean');
  if (!Array.isArray(value.commitScope) || !value.commitScope.every(text)) errors.push('commitScope must be an array of paths');
  if (value.commitOptIn === true && Array.isArray(value.commitScope) && !value.commitScope.length) errors.push('commit opt-in requires an explicit scope');
  if (!Array.isArray(value.stages) || value.stages.length !== names.length) return [...errors, 'stages must contain all five ordered stages'];
  let incomplete = false;
  for (let i = 0; i < names.length; i++) {
    const stage = value.stages[i];
    const label = names[i];
    if (!object(stage) || stage.name !== label) { errors.push(`${label}: stage is missing or out of order`); incomplete = true; continue; }
    if (!['pending', 'running', 'blocked', 'complete'].includes(String(stage.status))) errors.push(`${label}: invalid status`);
    if (!Array.isArray(stage.checks) || !stage.checks.every(text)) errors.push(`${label}: checks must be an array of descriptions`);
    if (!Array.isArray(stage.blockers) || !stage.blockers.every(text)) errors.push(`${label}: blockers must be an array of descriptions`);
    if (stage.checkpoint !== null && (typeof stage.checkpoint !== 'string' || !/^[a-f0-9]{40,64}$/.test(stage.checkpoint))) errors.push(`${label}: invalid checkpoint SHA`);
    if (stage.checkpoint !== null && value.commitOptIn !== true) errors.push(`${label}: checkpoint requires commit opt-in`);
    if (incomplete && (stage.status === 'running' || stage.status === 'blocked')) errors.push(`${label}: earlier stage is incomplete`);
    if (stage.status === 'complete') {
      if (incomplete) errors.push(`${label}: earlier stage is incomplete`);
      if (!Array.isArray(stage.outputs) || !stage.outputs.length) errors.push(`${label}: completed stage needs outputs`);
      if (!Array.isArray(stage.checks) || !stage.checks.length) errors.push(`${label}: completed stage needs validation evidence`);
      if (Array.isArray(stage.blockers) && stage.blockers.length) errors.push(`${label}: completed stage cannot have blockers`);
      errors.push(...artifactErrors(stage.inputs, projectRoot, `${label} inputs`), ...artifactErrors(stage.outputs, projectRoot, `${label} outputs`));
    } else {
      incomplete = true;
      if (!Array.isArray(stage.inputs) || !Array.isArray(stage.outputs)) errors.push(`${label}: inputs and outputs must be arrays`);
      if (stage.status === 'blocked' && (!Array.isArray(stage.blockers) || !stage.blockers.length)) errors.push(`${label}: blocked stage requires a reason`);
      if (stage.checkpoint !== null) errors.push(`${label}: only completed stages may have checkpoints`);
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const path = process.argv[2];
  if (!path) { console.error('usage: npm run validate:news-run -- <state.json>'); process.exitCode = 1; }
  else {
    try {
      const errors = validateNewsRun(JSON.parse(readFileSync(resolve(root, path), 'utf8')), root);
      for (const error of errors) console.error(`error ${error}`);
      if (errors.length) process.exitCode = 1;
      else console.log('news run: structurally valid; state does not prove authorization, facts or Git checkpoints');
    } catch (error) { console.error(`error ${error instanceof Error ? error.message : 'invalid state'}`); process.exitCode = 1; }
  }
}
