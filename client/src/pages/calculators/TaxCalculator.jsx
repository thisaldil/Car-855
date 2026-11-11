import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Empty, Field } from '../../components/ui.jsx';
import { useTitle } from '../../hooks/useSettings.js';
import { calculateTax } from '../../lib/calculators/tax.js';
import { buildPdf } from '../../lib/calculators/pdf.js';
import { TAX_RATES } from '../../lib/calculators/rates.js';
import CalculatorActions, { money, number, ResultRow } from './CalculatorActions.jsx';

const schema = z.object({ cifJpy: z.coerce.number().positive('Enter a positive CIF value'), jpyToLkr: z.coerce.number().positive('Enter a positive exchange rate'), fuelType: z.string(), capacity: z.coerce.number().positive('Enter a positive capacity') });
export default function TaxCalculator() {
  useTitle('Vehicle Tax Calculator');
  const [result, setResult] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { fuelType: 'Petrol' } });
  const onSubmit = (input) => setResult(calculateTax(input));
  const download = () => { const pdf = buildPdf({ title: 'Vehicle Tax Estimate', inputs: [['CIF (JPY)', result.input?.cifJpy], ['JPY/LKR rate', result.input?.jpyToLkr], ['Fuel type', result.input?.fuelType], ['Capacity', result.input?.capacity]], rows: result.lines, totals: [['Total tax', result.total], ['CIF + total tax (estimate)', result.estimate]], disclaimer: 'Indicative estimate only. Unconfigured official rates are shown explicitly and must be confirmed before import.' }); pdf.doc.save('tax-estimate-' + new Date().toISOString().slice(0, 10) + '.pdf'); };
  return <div className="grid gap-6 lg:grid-cols-2">
    <form onSubmit={handleSubmit((input) => { setResult({ ...calculateTax(input), input }); })} className="card no-print grid gap-4 p-6">
      <Field label="CIF value (JPY)" error={errors.cifJpy}><input className="input" type="number" step="any" inputMode="decimal" {...register('cifJpy')} /></Field>
      <Field label="JPY to LKR exchange rate" error={errors.jpyToLkr} hint="Use the current Customs exchange-rate publication."><input className="input" type="number" step="any" inputMode="decimal" {...register('jpyToLkr')} /></Field>
      <a className="text-sm text-gold underline" href="https://www.customs.gov.lk/exchange-rates/" target="_blank" rel="noreferrer">Check Customs exchange rates</a>
      <Field label="Fuel type"><select className="input" {...register('fuelType')}>{Object.keys(TAX_RATES.excise).map((fuel) => <option key={fuel}>{fuel}</option>)}</select></Field>
      <Field label="Capacity (cc)" error={errors.capacity}><input className="input" type="number" step="any" inputMode="decimal" {...register('capacity')} /></Field>
      <CalculatorActions onReset={() => { reset(); setResult(null); }} onDownload={download} hasResult={Boolean(result)} />
    </form>
    <section className="card results-card p-6" aria-live="polite">
      <h2 className="font-bold">Tax estimate</h2>
      {!result && <div className="mt-4"><Empty title="No estimate yet" hint="Enter vehicle details to see the tax breakdown." /></div>}
      {result?.error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{result.error}</p>}
      {result && !result.error && <div className="mt-4 text-sm">
        <ResultRow label="HS code" value={result.hs || 'Rate not configured'} /><ResultRow label="CIF value (LKR)" value={money(result.cifLkr)} />
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b"><th className="py-2">Type</th><th>Tax Base</th><th>Rate</th><th className="text-right">Amount</th></tr></thead><tbody>{result.lines.map((line) => <tr key={line.type} className="border-b border-gray-100"><td className="py-2">{line.type}</td><td>{number(line.taxBase)}</td><td>{line.rate == null ? '—' : `${line.rate * 100}%`}</td><td className="text-right">{money(line.amount)}</td></tr>)}</tbody></table></div>
        <div className="mt-4 rounded-xl bg-brand p-4 text-white"><ResultRow label="Total tax" value={money(result.total)} /><ResultRow label="CIF + total tax (estimate)" value={money(result.estimate)} /></div>
        {!result.configured && <p className="mt-3 rounded-lg bg-gold-100 p-3 text-xs text-gold-600">Rate not configured. This estimate cannot be completed until the applicable official excise/luxury rates are verified.</p>}
      </div>}
    </section>
  </div>;
}
