import test from 'node:test';
import assert from 'node:assert/strict';
import { applyRules } from '../services/calculator.js';
import { sanitize } from '../utils/helpers.js';

const config = { taxRules: [
  { name: 'A', type: 'percent', base: 'cif', value: 10 },
  { name: 'B', type: 'percent', base: 'running', value: 10 },
  { name: 'C', type: 'fixed', base: 'cif', value: 500 },
  { name: 'D', type: 'per_cc', base: 'cif', value: 2 },
] };

test('applies rules in order, running base compounds', () => {
  const { lines, total } = applyRules(config, { cifLKR: 1000, engineCapacity: 100 });
  assert.deepEqual(lines.map((l) => l.amount), [100, 110, 500, 200]);
  assert.equal(total, 910);
});
test('minimum amount is honoured', () => {
  const { lines } = applyRules({ taxRules: [{ name: 'M', type: 'percent', base: 'cif', value: 1, min: 50 }] }, { cifLKR: 1000 });
  assert.equal(lines[0].amount, 50);
});
test('sanitize strips operator and dotted keys', () => {
  assert.deepEqual(sanitize({ a: { $gt: '' }, 'b.c': 1, ok: [{ $ne: 1, x: 2 }] }), { a: {}, ok: [{ x: 2 }] });
});
