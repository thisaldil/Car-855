import { TaxConfiguration } from '../models/index.js';
import { AppError } from '../utils/helpers.js';

export const DISCLAIMER = 'Estimated Cost. Final charges may vary depending on applicable customs regulations and official assessments.';

export async function findConfig({ vehicleCategory, fuelType, engineCapacity, date = new Date() }) {
  const candidates = await TaxConfiguration.find({
    isActive: true,
    effectiveFrom: { $lte: date },
    $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }, { effectiveTo: { $gte: date } }],
    'engineCapacityRange.min': { $lte: engineCapacity || 0 },
    'engineCapacityRange.max': { $gte: engineCapacity || 0 },
  }).select('-history');
  const matches = candidates.filter((c) =>
    (c.vehicleCategory === 'any' || c.vehicleCategory === vehicleCategory) &&
    (c.fuelType === 'any' || c.fuelType === fuelType));
  // most specific, then most recent
  matches.sort((a, b) => {
    const spec = (c) => (c.vehicleCategory !== 'any') + (c.fuelType !== 'any');
    return spec(b) - spec(a) || b.effectiveFrom - a.effectiveFrom;
  });
  return matches[0] || null;
}

// Pure calculation from a config — all rates come from the database
export function applyRules(config, { cifLKR, engineCapacity = 0 }) {
  let running = cifLKR;
  const lines = [];
  for (const r of config.taxRules) {
    const base = r.base === 'running' ? running : cifLKR;
    let amount = r.type === 'percent' ? (base * r.value) / 100 : r.type === 'fixed' ? r.value : r.value * engineCapacity;
    if (r.min != null) amount = Math.max(amount, r.min);
    amount = Math.round(amount * 100) / 100;
    running += amount;
    lines.push({ name: r.name, type: r.type, value: r.value, base: r.base, amount });
  }
  return { lines, total: Math.round((running - cifLKR) * 100) / 100 };
}

export async function estimate(input) {
  const { cifValue, exchangeRate = 1, shippingCost = 0, otherCharges = 0, engineCapacity = 0 } = input;
  const config = await findConfig(input);
  if (!config) throw new AppError('No active tax configuration matches this vehicle. Please contact us for a manual estimate.', 404);
  const cifLKR = Math.round(cifValue * exchangeRate * 100) / 100;
  const { lines, total: taxes } = applyRules(config, { cifLKR, engineCapacity });
  return {
    cifValue, exchangeRate, cifLKR, taxLines: lines, estimatedTaxes: taxes, shippingCost, otherCharges,
    totalLandedCost: Math.round((cifLKR + taxes + shippingCost + otherCharges) * 100) / 100,
    configuration: { id: config._id, name: config.name, effectiveFrom: config.effectiveFrom },
    disclaimer: DISCLAIMER,
  };
}
