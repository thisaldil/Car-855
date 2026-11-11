import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Empty, Field } from '../../components/ui.jsx';
import { useTitle } from '../../hooks/useSettings.js';
import { calculateDemurrage } from '../../lib/calculators/demurrage.js';
import { buildPdf } from '../../lib/calculators/pdf.js';
import { DEMURRAGE_RATES } from '../../lib/calculators/rates.js';
import CalculatorActions, { money, ResultRow } from './CalculatorActions.jsx';

const schema = z.object({ days: z.coerce.number().int().min(1, 'Enter at least one day'), cbm: z.coerce.number().positive('Enter a positive CBM'), usdToLkr: z.coerce.number().positive('Enter a positive exchange rate') });
export default function DemurrageCalculator() {
  useTitle('Demurrage Calculator');
  const [result, setResult] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const submit = (input) => setResult({ ...calculateDemurrage(input), input });
  const download = () => { const pdf = buildPdf({ title: 'Hambantota Demurrage Estimate', inputs: [['Days', result.input.days], ['CBM', result.input.cbm], ['USD/LKR rate', result.input.usdToLkr]], rows: result.bands, totals: [['Subtotal USD', result.usd], ['Subtotal LKR', result.lkr], ['Tax (VAT & SSCL)', result.tax], ['Total Demurrage Charges', result.total]], disclaimer: 'This covers charges beyond the 10 free days only, not total port or clearing costs.' }); pdf.doc.save('demurrage-estimate-' + new Date().toISOString().slice(0, 10) + '.pdf'); };
  return <div>
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSubmit(submit)} className="card no-print grid gap-4 p-6">
        <Field label="Days in port" error={errors.days}><input className="input" type="number" min="1" inputMode="numeric" {...register('days')} /></Field>
        <Field label="CBM (refer to the Bill of Lading)" error={errors.cbm}><input className="input" type="number" min="0" step="any" inputMode="decimal" {...register('cbm')} /></Field>
        <Field label="USD to LKR rate" error={errors.usdToLkr}><input className="input" type="number" min="0" step="any" inputMode="decimal" {...register('usdToLkr')} /></Field>
        <a className="text-sm text-gold underline" href="https://www.cbsl.gov.lk/en/rates-and-indicators/exchange-rates" target="_blank" rel="noreferrer">Check CBSL USD/LKR rates</a>
        <CalculatorActions onReset={() => { reset(); setResult(null); }} onDownload={download} hasResult={Boolean(result)} />
      </form>
      <section className="card results-card p-6" aria-live="polite"><h2 className="font-bold">Demurrage estimate</h2>
      {!result && <div className="mt-4"><Empty title="No estimate yet" hint="Enter port days, CBM, and the USD/LKR rate." /></div>}
      {result && <div className="mt-4 text-sm">
        {result.bands.map((band) => <ResultRow key={band.label} label={band.label} value={band.usd == null ? 'Rate not configured' : `$ ${band.usd.toFixed(2)}`} />)}
        <ResultRow label="Subtotal USD" value={result.usd == null ? 'Rate not configured' : `$ ${result.usd.toFixed(2)}`} /><ResultRow label="Subtotal LKR" value={money(result.lkr)} /><ResultRow label="Tax (VAT & SSCL)" value={money(result.tax)} />
        <div className="mt-3 rounded-xl bg-brand p-4 text-white"><ResultRow label="Total Demurrage Charges" value={money(result.total)} /></div>
        <p className="mt-3 rounded-lg bg-gold-100 p-3 text-xs text-gold-600">This estimate covers only charges beyond the 10 free days and not total port or clearing costs.</p>
        {!result.configured && <p className="mt-2 text-xs text-red-600">Rate not configured for day 31 onwards.</p>}
      </div>}
      </section>
    </div>
    <section className="card mt-6 p-6">
      <h2 className="text-lg font-bold">Reference Documents</h2>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
        <div>
          <p className="font-semibold">HIPG Tariff</p>
          <p className="mt-1 text-sm text-gray-500">2025</p>
        </div>
        <a className="btn-ghost" href="https://www.hipg.lk/images/tariff/hipg-tariff-2025.pdf" target="_blank" rel="noreferrer">View PDF</a>
      </div>
    </section>
  </div>;
}
