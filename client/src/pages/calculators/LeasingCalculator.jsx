import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Empty, Field } from '../../components/ui.jsx';
import { useTitle } from '../../hooks/useSettings.js';
import { calculateLeasing } from '../../lib/calculators/leasing.js';
import { buildPdf } from '../../lib/calculators/pdf.js';
import { LEASING_METHOD } from '../../lib/calculators/rates.js';
import CalculatorActions, { money, ResultRow } from './CalculatorActions.jsx';

const schema = z.object({ amount: z.coerce.number().positive('Enter a positive amount'), months: z.coerce.number().int().min(1).max(120), ratePct: z.coerce.number().min(0).max(100) });
export default function LeasingCalculator() {
  useTitle('Leasing Calculator');
  const [result, setResult] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { months: 60, ratePct: 12 } });
  const submit = (input) => setResult({ ...calculateLeasing(input), input });
  const download = () => { const pdf = buildPdf({ title: 'Leasing Estimate', inputs: [['Amount (LKR)', result.input.amount], ['Months', result.input.months], ['Annual rate', `${result.input.ratePct}%`]], rows: [{ type: 'Monthly payment', amount: result.monthly }, { type: 'Total repayment', amount: result.total }, { type: 'Interest', amount: result.interest }], schedule: result.schedule, totals: [['Monthly payment', result.monthly], ['Total repayment', result.total], ['Total interest', result.interest]], disclaimer: 'Fees, insurance, and taxes are not included.' }); pdf.doc.save('leasing-estimate-' + new Date().toISOString().slice(0, 10) + '.pdf'); };
  return <div className="grid gap-6 lg:grid-cols-2">
    <form onSubmit={handleSubmit(submit)} className="card no-print grid gap-4 p-6">
      <Field label="Lease amount (LKR)" error={errors.amount}><input className="input" type="number" min="0" step="any" inputMode="decimal" {...register('amount')} /></Field>
      <Field label="Term (months)" error={errors.months}><input className="input" type="number" min="1" max="120" inputMode="numeric" {...register('months')} /></Field>
      <Field label="Annual interest rate (%)" error={errors.ratePct}><input className="input" type="number" min="0" max="100" step="any" inputMode="decimal" {...register('ratePct')} /></Field>
      <CalculatorActions onReset={() => { reset(); setResult(null); setShowSchedule(false); }} onDownload={download} hasResult={Boolean(result)} />
    </form>
    <section className="card results-card p-6" aria-live="polite"><h2 className="font-bold">Leasing estimate</h2>
      {!result && <div className="mt-4"><Empty title="No estimate yet" hint="Enter an amount, term, and annual rate." /></div>}
      {result && <div className="mt-4 text-sm"><ResultRow label="Monthly payment" value={money(result.monthly)} /><ResultRow label="Total repayment" value={money(result.total)} /><ResultRow label="Total interest" value={money(result.interest)} />
        <button type="button" className="btn-ghost no-print mt-4" onClick={() => setShowSchedule(!showSchedule)}>{showSchedule ? 'Hide' : 'Show'} amortization schedule</button>
        {showSchedule && <div className="mt-3 max-h-80 overflow-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead><tr className="border-b"><th className="py-2">Month</th><th>Opening</th><th>Interest</th><th>Principal</th><th>Closing</th></tr></thead><tbody>{result.schedule.map((line) => <tr key={line.month} className="border-b border-gray-100"><td className="py-2">{line.month}</td><td>{money(line.opening)}</td><td>{money(line.interest)}</td><td>{money(line.principal)}</td><td>{money(line.closing)}</td></tr>)}</tbody></table></div>}
        <p className="mt-3 rounded-lg bg-gold-100 p-3 text-xs text-gold-600">Fees, insurance, and taxes are not included. Method: {LEASING_METHOD} balance.</p>
      </div>}
    </section>
  </div>;
}
