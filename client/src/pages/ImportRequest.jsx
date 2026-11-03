import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { api, errMsg } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTitle } from '../hooks/useSettings.js';
import { Field } from '../components/ui.jsx';
import { FUELS, TRANSMISSIONS } from '../utils/format.js';

const schema = z.object({
  make: z.string().min(1, 'Required'), model: z.string().min(1, 'Required'),
  manufacturingYear: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1).optional().or(z.literal('').transform(() => undefined)),
  grade: z.string().optional(), fuelType: z.string().optional(), transmission: z.string().optional(),
  budget: z.coerce.number().positive('Enter your budget in LKR').optional().or(z.literal('').transform(() => undefined)),
  timeframe: z.string().optional(), requirements: z.string().optional(),
});
export default function ImportRequest() {
  useTitle('Import a Vehicle from Japan', 'Tell us what you want and we handle auctions, shipping and clearance.');
  const { user } = useAuth(); const [sp] = useSearchParams(); const nav = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { make: sp.get('make') || '', model: sp.get('model') || '', manufacturingYear: sp.get('year') || '' } });
  const m = useMutation({
    mutationFn: ({ make, model, manufacturingYear, grade, fuelType, transmission, ...rest }) => api.post('/import-requests', { preferredVehicle: { make, model, manufacturingYear, grade, fuelType: fuelType || undefined, transmission: transmission || undefined }, auctionListing: sp.get('auction') || undefined, ...rest }),
    onSuccess: () => nav('/account/imports'),
  });
  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <h1 className="text-3xl font-extrabold">Import a vehicle from Japan</h1>
        <p className="mt-3 text-gray-600">Tell us what you're looking for. We search Japanese auctions and suppliers, send you a quotation, and handle purchase, shipping and clearance after your approval.</p>
        <ol className="mt-6 space-y-3 text-sm">{['Submit your request', 'We review and search for matching vehicles', 'Receive a transparent quotation', 'Approve, and we purchase and ship', 'Customs clearance and delivery'].map((t, i) => <li key={t} className="flex gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-gold text-xs font-bold text-white">{i + 1}</span>{t}</li>)}</ol>
        <Link to="/calculator" className="btn-ghost mt-6">Estimate import costs first</Link>
      </div>
      <div className="card p-6">
        {!user ? <div className="text-center"><p className="mb-4">Please log in or create an account to submit an import request and track its progress.</p><div className="flex justify-center gap-3"><Link to="/login" state={{ from: '/import' }} className="btn-dark">Login</Link><Link to="/register" className="btn-gold">Create account</Link></div></div> :
          <form onSubmit={handleSubmit((b) => m.mutate(b))} className="grid gap-4 sm:grid-cols-2">
            <Field label="Preferred make" error={errors.make}><input className="input" {...register('make')} /></Field>
            <Field label="Preferred model" error={errors.model}><input className="input" {...register('model')} /></Field>
            <Field label="Manufacturing year" error={errors.manufacturingYear}><input type="number" className="input" {...register('manufacturingYear')} /></Field>
            <Field label="Grade / variant"><input className="input" {...register('grade')} /></Field>
            <Field label="Fuel type"><select className="input" {...register('fuelType')}><option value="">Any</option>{FUELS.map((f) => <option key={f}>{f}</option>)}</select></Field>
            <Field label="Transmission"><select className="input" {...register('transmission')}><option value="">Any</option>{TRANSMISSIONS.map((f) => <option key={f}>{f}</option>)}</select></Field>
            <Field label="Budget (LKR)" error={errors.budget}><input type="number" className="input" {...register('budget')} /></Field>
            <Field label="Expected delivery"><select className="input" {...register('timeframe')}><option value="">Flexible</option><option>Within 1 month</option><option>1–2 months</option><option>2–3 months</option><option>3+ months</option></select></Field>
            <div className="sm:col-span-2"><Field label="Additional requirements"><textarea rows={4} className="input" {...register('requirements')} /></Field></div>
            {m.isError && <p className="text-sm text-red-600 sm:col-span-2">{errMsg(m.error)}</p>}
            <button className="btn-gold sm:col-span-2" disabled={m.isPending}>{m.isPending ? 'Submitting…' : 'Submit import request'}</button>
          </form>}
      </div>
    </div>
  );
}
