import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, get, errMsg } from '../services/api.js';
import { useTitle } from '../hooks/useSettings.js';
import { Field } from '../components/ui.jsx';
import { FUELS, lkr } from '../utils/format.js';

const n = (label) => z.coerce.number({ invalid_type_error: `${label} must be a number` }).min(0);
const schema = z.object({ make: z.string().optional(), model: z.string().optional(), manufacturingYear: z.coerce.number().optional().or(z.literal('').transform(() => undefined)), vehicleCategory: z.string(), fuelType: z.string(), engineCapacity: n('Engine capacity'), cifValue: z.coerce.number().positive('Enter the CIF value'), exchangeRate: z.coerce.number().positive('Enter exchange rate'), shippingCost: n('Shipping'), otherCharges: n('Other charges') });

export default function Calculator() {
  useTitle('Import Cost Calculator');
  const cats = useQuery({ queryKey: ['cats'], queryFn: () => get('/categories', { limit: 100 }).then((r) => r.data) });
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { vehicleCategory: 'any', fuelType: 'Petrol', exchangeRate: 1, shippingCost: 0, otherCharges: 0 } });
  const m = useMutation({ mutationFn: (b) => api.post('/calculator/estimate', b).then((r) => r.data.data) });
  const r = m.data;
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-extrabold">Vehicle Import Cost Calculator</h1>
      <p className="mt-1 text-sm text-gray-500">Duties and taxes come from rules configured by our team, not fixed values in this page.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit((b) => m.mutate(b))} className="card grid gap-4 p-6 sm:grid-cols-2">
          <Field label="Make"><input className="input" {...register('make')} /></Field>
          <Field label="Model"><input className="input" {...register('model')} /></Field>
          <Field label="Manufacturing year"><input type="number" className="input" {...register('manufacturingYear')} /></Field>
          <Field label="Engine capacity (cc)" error={errors.engineCapacity}><input type="number" className="input" {...register('engineCapacity')} /></Field>
          <Field label="Fuel type"><select className="input" {...register('fuelType')}>{FUELS.map((f) => <option key={f}>{f}</option>)}</select></Field>
          <Field label="Vehicle category"><select className="input" {...register('vehicleCategory')}><option value="any">Any / not sure</option>{cats.data?.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></Field>
          <Field label="CIF value (foreign currency)" error={errors.cifValue}><input type="number" step="any" className="input" {...register('cifValue')} /></Field>
          <Field label="Exchange rate to LKR" error={errors.exchangeRate}><input type="number" step="any" className="input" {...register('exchangeRate')} /></Field>
          <Field label="Shipping cost (LKR)" error={errors.shippingCost}><input type="number" className="input" {...register('shippingCost')} /></Field>
          <Field label="Other charges (LKR)" error={errors.otherCharges}><input type="number" className="input" {...register('otherCharges')} /></Field>
          <button className="btn-gold sm:col-span-2" disabled={m.isPending}>{m.isPending ? 'Calculating…' : 'Calculate estimate'}</button>
        </form>
        <div className="card p-6">
          <h2 className="font-bold">Estimate</h2>
          {m.isError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errMsg(m.error)}</p>}
          {!r && !m.isError && <p className="mt-3 text-sm text-gray-500">Fill in the form to see an estimated landed cost.</p>}
          {r && <div className="mt-3 text-sm">
            <Row k="Vehicle CIF value (LKR)" v={lkr(r.cifLKR)} />
            {r.taxLines.map((l) => <Row key={l.name} k={`${l.name} ${l.type === 'percent' ? `(${l.value}%)` : ''}`} v={lkr(l.amount)} sub />)}
            <Row k="Estimated duties & taxes" v={lkr(r.estimatedTaxes)} />
            <Row k="Shipping charges" v={lkr(r.shippingCost)} /><Row k="Other expenses" v={lkr(r.otherCharges)} />
            <div className="mt-3 flex justify-between rounded-xl bg-brand p-4 text-white"><span className="font-semibold">Total estimated landed cost</span><span className="text-lg font-extrabold text-gold">{lkr(r.totalLandedCost)}</span></div>
            <p className="mt-2 text-xs text-gray-500">Rules applied: {r.configuration.name}</p>
            <p className="mt-3 rounded-lg bg-gold-100 p-3 text-xs text-gold-600">{r.disclaimer}</p>
          </div>}
        </div>
      </div>
    </div>
  );
}
const Row = ({ k, v, sub }) => <div className={`flex justify-between border-b border-gray-100 py-2 ${sub ? 'pl-4 text-gray-500' : ''}`}><span>{k}</span><span className="font-semibold">{v}</span></div>;
