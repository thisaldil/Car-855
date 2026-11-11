import { LEASING_METHOD } from './rates.js';

export function calculateLeasing(input, method = LEASING_METHOD) {
  const amount = Number(input.amount);
  const months = Number(input.months);
  const ratePct = Number(input.ratePct);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(months) || months < 1 || months > 120 || !Number.isFinite(ratePct) || ratePct < 0 || ratePct > 100) {
    return { error: 'Enter a valid amount, term from 1 to 120 months, and rate from 0 to 100%.' };
  }
  const r = ratePct / 1200;
  const interest = method === 'flat' ? amount * ratePct / 100 * months / 12 : null;
  const monthly = method === 'flat'
    ? (amount + interest) / months
    : r === 0 ? amount / months : amount * r / (1 - (1 + r) ** -months);
  const total = monthly * months;
  const schedule = [];
  let opening = amount;
  for (let month = 1; month <= months; month += 1) {
    const monthlyInterest = method === 'flat' ? interest / months : opening * r;
    const principal = month === months ? opening : monthly - monthlyInterest;
    const closing = Math.max(0, opening - principal);
    schedule.push({ month, opening, interest: monthlyInterest, principal, closing });
    opening = closing;
  }
  return { method, monthly, total, interest: method === 'flat' ? interest : total - amount, schedule };
}

