import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { clampPosition, flatPosition, nextPosition, positionFromFlat, previousPosition } from '../src/lib/keynote-navigation';

test('next and back traverse reveals before changing scenes', () => {
  const counts = [0, 2, 0];
  assert.deepEqual(nextPosition(counts, { index: 0, step: 0 }), { index: 1, step: 0 });
  assert.deepEqual(nextPosition(counts, { index: 1, step: 0 }), { index: 1, step: 1 });
  assert.deepEqual(nextPosition(counts, { index: 1, step: 2 }), { index: 2, step: 0 });
  assert.deepEqual(nextPosition([0, 2], { index: 1, step: 2 }), { index: 1, step: 2 });
  assert.deepEqual(previousPosition(counts, { index: 2, step: 0 }), { index: 1, step: 2 });
  assert.deepEqual(previousPosition(counts, { index: 0, step: 0 }), { index: 0, step: 0 });
});

test('remote positions round-trip across variable reveal counts and clamp safely', () => {
  const counts = [0, 2, 1];
  for (let flat = 0; flat < 6; flat++) {
    assert.equal(flatPosition(counts, positionFromFlat(counts, flat)), flat);
  }
  assert.deepEqual(positionFromFlat(counts, 100), { index: 2, step: 1 });
  assert.deepEqual(clampPosition(counts, { index: -1, step: 40 }), { index: 0, step: 0 });
});
