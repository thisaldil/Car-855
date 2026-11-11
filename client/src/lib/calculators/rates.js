export const TAX_RATES = {
  effectiveDate: '2025-04-29',
  source: 'https://www.customs.gov.lk/wp-content/uploads/2026/10/gz29A.pdf',
  cid: 0.30,
  surcharge: 0.50,
  vat: 0.18,
  ssl: 0.025,
  vel: 15000,
  fees: 4000,
  excise: {
    Petrol: { unit: 'cc', bands: null }, // TODO verify against the current gazette
    Diesel: { unit: 'cc', bands: null }, // TODO verify against the current gazette
    Electric: { unit: 'kW', bands: null }, // TODO verify against the current gazette
    'Petrol Hybrid': { unit: 'cc', bands: null }, // TODO verify against the current gazette
    'Diesel Hybrid': { unit: 'cc', bands: null }, // TODO verify against the current gazette
    'E-Power Hybrid': { unit: 'kW', bands: null }, // TODO verify against the current gazette
  },
  luxury: {
    effectiveDate: '2025-04-29',
    source: 'https://www.customs.gov.lk/wp-content/uploads/2026/10/gz28A.pdf',
    Petrol: null, // TODO verify threshold, rate, and value basis
    Diesel: null, // TODO verify threshold, rate, and value basis
    Electric: null, // TODO verify threshold, rate, and value basis
    'Petrol Hybrid': null, // TODO verify threshold, rate, and value basis
    'Diesel Hybrid': null, // TODO verify threshold, rate, and value basis
    'E-Power Hybrid': null, // TODO verify threshold, rate, and value basis
  },
  hsCodes: {
    Petrol: '8703.21-8703.24',
    Diesel: '8703.31-8703.33',
    Electric: '8703.80',
    'Petrol Hybrid': '8703.40',
    'Diesel Hybrid': '8703.50',
    'E-Power Hybrid': '8703.80', // TODO verify e-Power refinement
  },
};

export const DEMURRAGE_RATES = {
  effectiveDate: '2026-01-01',
  source: 'https://www.hipg.lk/images/tariff/hipg-tariff-2026.pdf',
  freeDays: 10,
  day11To20: 0.60,
  day21To30: 1.20,
  day31Onwards: null, // TODO verify item 3.4 of the 2026 HIPG tariff
  taxMode: 'additive',
  vat: 0.18,
  ssl: 0.025,
};

export const LEASING_METHOD = 'reducing';
export const LEASING_RATES = {
  effectiveDate: '2026-01-01',
  source: 'User-provided leasing formula; verify against current lender terms',
};

