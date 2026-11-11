import { TAX_RATES } from './rates.js';

const finitePositive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
const findBand = (bands, value) => bands?.find((band) => value >= band.min && value < band.max);

export function calculateTax(input, rates = TAX_RATES) {
  const { cifJpy, jpyToLkr, fuelType, capacity, ageBand } = input;
  if (![cifJpy, jpyToLkr, capacity].every(finitePositive) || !rates.excise[fuelType]) {
    return { configured: false, error: 'Enter valid positive values and select a supported fuel type.' };
  }
  const cifLkr = Number(cifJpy) * Number(jpyToLkr);
  const cid = cifLkr * rates.cid;
  const sur = cid * rates.surcharge;
  const exciseConfig = rates.excise[fuelType];
  const band = findBand(exciseConfig.bands?.[ageBand] || exciseConfig.bands, Number(capacity));
  const xid = band ? Math.max(Number(capacity) * band.ratePerUnit, band.minimumAmount || 0) : null;
  const luxuryConfig = rates.luxury[fuelType];
  const lxt = luxuryConfig == null ? 0 : Math.max(0, luxuryConfig.rate * (luxuryConfig.thresholdValue - luxuryConfig.threshold));
  const base = [xid, lxt].every((value) => value != null) ? cifLkr + cid + sur + xid + lxt : null;
  const vat = base == null ? null : base * rates.vat;
  const ssl = base == null ? null : base * rates.ssl;
  const lines = [
    { type: 'CID', taxBase: cifLkr, rate: rates.cid, amount: cid },
    { type: 'SUR', taxBase: cid, rate: rates.surcharge, amount: sur },
    { type: 'XID', taxBase: Number(capacity), rate: band?.ratePerUnit ?? null, amount: xid },
    { type: 'LXT', taxBase: luxuryConfig?.thresholdValue ?? null, rate: luxuryConfig?.rate ?? null, amount: lxt },
    { type: 'VAT', taxBase: base, rate: rates.vat, amount: vat },
    { type: 'SSL', taxBase: base, rate: rates.ssl, amount: ssl },
    { type: 'VEL', taxBase: 1, rate: null, amount: rates.vel },
    { type: 'COM/EXM/SEL', taxBase: 1, rate: null, amount: rates.fees },
  ];
  const displayedLines = lines.map((line) => ({ ...line, amount: line.amount == null ? null : Math.round(line.amount) }));
  const total = displayedLines.every((line) => line.amount != null) ? displayedLines.reduce((sum, line) => sum + line.amount, 0) : null;
  return {
    configured: total != null,
    hs: rates.hsCodes[fuelType],
    cifLkr: Math.round(cifLkr),
    lines: displayedLines.filter((line) => line.type !== 'LXT' || line.amount > 0),
    total,
    estimate: total == null ? null : Math.round(cifLkr) + total,
    missing: total == null ? 'Rate not configured' : null,
  };
}
