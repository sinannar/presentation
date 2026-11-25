export interface Position {
  index: number;
  step: number;
}

export function clampPosition(counts: number[], position: Position): Position {
  if (!counts.length) return { index: 0, step: 0 };
  const index = Math.max(0, Math.min(Math.trunc(position.index) || 0, counts.length - 1));
  const step = Math.max(0, Math.min(Math.trunc(position.step) || 0, counts[index]));
  return { index, step };
}

export function nextPosition(counts: number[], current: Position): Position {
  const position = clampPosition(counts, current);
  if (position.step < counts[position.index]) return { ...position, step: position.step + 1 };
  if (position.index === counts.length - 1) return position;
  return clampPosition(counts, { index: position.index + 1, step: 0 });
}

export function previousPosition(counts: number[], current: Position): Position {
  const position = clampPosition(counts, current);
  if (position.step > 0) return { ...position, step: position.step - 1 };
  const index = Math.max(0, position.index - 1);
  return { index, step: index === position.index ? 0 : counts[index] };
}

export function flatPosition(counts: number[], position: Position): number {
  const current = clampPosition(counts, position);
  return counts.slice(0, current.index).reduce((sum, count) => sum + count + 1, 0) + current.step;
}

export function positionFromFlat(counts: number[], value: number): Position {
  let remainder = Math.max(0, Math.trunc(value) || 0);
  for (let index = 0; index < counts.length; index++) {
    if (remainder <= counts[index]) return { index, step: remainder };
    remainder -= counts[index] + 1;
  }
  return clampPosition(counts, { index: counts.length - 1, step: counts.at(-1) || 0 });
}
