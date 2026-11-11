import { describe, expect, it } from 'vitest';
import { calculateDemurrage } from './demurrage.js';
import { calculateLeasing } from './leasing.js';
import { calculateTax } from './tax.js';

const demurrageRates = { freeDays: 10, day11To20: 0.6, day21To30: 1.2, day31Onwards: 2, vat: 0.18, ssl: 0.025 };

describe('demurrage', () => {
  it.each([[10, 0], [11, 0.6], [20, 6], [21, 7.2], [30, 18], [31, 20]])('handles day %i', (days, expected) => {
    expect(calculateDemurrage({ days, cbm: 1, usdToLkr: 1 }, demurrageRates).usd).toBeCloseTo(expected);
  });
  it('supports decimal CBM', () => expect(calculateDemurrage({ days: 11, cbm: 1.5, usdToLkr: 300 }, demurrageRates).usd).toBeCloseTo(0.9));
});

describe('leasing', () => {
  it('calculates reducing balance', () => {
    const result = calculateLeasing({ amount: 1000000, months: 12, ratePct: 12 });
    expect(result.monthly).toBeCloseTo(88848.79, 2);
    expect(result.interest).toBeCloseTo(66185.5, 1);
    expect(result.schedule.at(-1).closing).toBe(0);
  });
  it('calculates flat interest', () => expect(calculateLeasing({ amount: 1000000, months: 12, ratePct: 12 }, 'flat').monthly).toBeCloseTo(93333.33, 2));
});

describe('tax', () => {
  it('preserves the tax chain with configured rates', () => {
    const rates = {
      cid: 0.3, surcharge: 0.5, vat: 0.18, ssl: 0.025, vel: 15000, fees: 4000,
      excise: { Petrol: { unit: 'cc', bands: [{ min: 0, max: 2000, ratePerUnit: 100 }] } },
      luxury: { Petrol: null }, hsCodes: { Petrol: '8703.21' },
    };
    const result = calculateTax({ cifJpy: 100, jpyToLkr: 1000, fuelType: 'Petrol', capacity: 1000 }, rates);
    const byType = Object.fromEntries(result.lines.map((line) => [line.type, line.amount]));
    expect(byType.SUR).toBe(byType.CID / 2);
    expect(byType.VAT).toBeCloseTo((100000 + byType.CID + byType.SUR + byType.XID) * 0.18);
    expect(byType.SSL).toBeCloseTo((100000 + byType.CID + byType.SUR + byType.XID) * 0.025);
    expect(result.total).toBe(result.lines.reduce((sum, line) => sum + line.amount, 0));
  });
});

it.todo('matches live tax parity fixtures within one rupee');
