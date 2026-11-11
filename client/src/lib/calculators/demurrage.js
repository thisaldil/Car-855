import { DEMURRAGE_RATES } from './rates.js';

export function calculateDemurrage(input, rates = DEMURRAGE_RATES) {
  const days = Number(input.days);
  const cbm = Number(input.cbm);
  const usdToLkr = Number(input.usdToLkr);
  if (!Number.isInteger(days) || days < 1 || !Number.isFinite(cbm) || cbm <= 0 || !Number.isFinite(usdToLkr) || usdToLkr <= 0) {
    return { configured: false, error: 'Enter valid values for days, CBM, and the USD/LKR rate.' };
  }
  const band1 = Math.max(0, Math.min(days, 20) - 10) * rates.day11To20 * cbm;
  const band2 = Math.max(0, Math.min(days, 30) - 20) * rates.day21To30 * cbm;
  const band3 = rates.day31Onwards == null ? null : Math.max(0, days - 30) * rates.day31Onwards * cbm;
  const usd = band3 == null ? null : band1 + band2 + band3;
  const lkr = usd == null ? null : usd * usdToLkr;
  const tax = lkr == null ? null : lkr * (rates.vat + rates.ssl);
  return {
    configured: usd != null,
    bands: [
      { label: 'Day 11-20', usd: band1 },
      { label: 'Day 21-30', usd: band2 },
      { label: 'Day 31 Onwards', usd: band3 },
    ],
    usd, lkr, tax, total: lkr == null ? null : lkr + tax,
    missing: usd == null ? 'Rate not configured' : null,
  };
}

