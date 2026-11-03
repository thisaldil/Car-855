import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { get } from '../services/api.js';
import { useTitle } from '../hooks/useSettings.js';
import VehicleCard from '../components/VehicleCard.jsx';
import { Skeleton, Empty, ErrorState, Pager, Field } from '../components/ui.jsx';
import { FUELS, TRANSMISSIONS } from '../utils/format.js';

export default function Vehicles() {
  useTitle('Vehicle Stock', 'Browse cars available in Sri Lanka and Japanese imports.');
  const [sp, setSp] = useSearchParams(); const [show, setShow] = useState(false);
  const params = Object.fromEntries(sp); const p = { limit: 12, ...params };
  const q = useQuery({ queryKey: ['vehicles', p], queryFn: () => get('/vehicles', p), placeholderData: (p) => p });
  const facets = useQuery({ queryKey: ['facets'], queryFn: () => get('/vehicles/facets').then((r) => r.data) });
  const cats = useQuery({ queryKey: ['cats'], queryFn: () => get('/categories', { limit: 100 }).then((r) => r.data) });
  const set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== 'page') n.delete('page'); setSp(n); };
  const Sel = ({ k, label, opts }) => <Field label={label}><select className="input" value={params[k] || ''} onChange={(e) => set(k, e.target.value)}><option value="">Any</option>{opts?.map((o) => <option key={o.v ?? o} value={o.v ?? o}>{o.l ?? o}</option>)}</select></Field>;
  const Num = ({ k, label, ph }) => <Field label={label}><input type="number" className="input" placeholder={ph} defaultValue={params[k] || ''} onBlur={(e) => set(k, e.target.value)} /></Field>;
  return (
    <div className="container-x py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-extrabold">Vehicle Stock</h1><p className="text-sm text-gray-500">{q.data?.meta ? `${q.data.meta.total} vehicles` : ' '}</p></div>
        <div className="flex gap-2">
          <button className="btn-ghost lg:hidden" onClick={() => setShow(!show)}><SlidersHorizontal size={16} />Filters</button>
          <select className="input w-auto" value={params.sort || 'newest'} onChange={(e) => set('sort', e.target.value)}>
            <option value="newest">Newest listings</option><option value="price-asc">Lowest price</option><option value="price-desc">Highest price</option><option value="mileage-asc">Lowest mileage</option><option value="year-desc">Newest year</option></select>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className={`${show ? 'block' : 'hidden'} card h-fit space-y-3 p-4 lg:block`}>
          <Field label="Keyword"><input className="input" defaultValue={params.q || ''} placeholder="Make, model…" onKeyDown={(e) => e.key === 'Enter' && set('q', e.target.value)} onBlur={(e) => set('q', e.target.value)} /></Field>
          <Sel k="vehicleCategory" label="Category" opts={cats.data?.map((c) => ({ v: c.slug, l: c.name }))} />
          <Sel k="make" label="Manufacturer" opts={facets.data?.makes} />
          <Sel k="model" label="Model" opts={facets.data?.models} />
          <div className="grid grid-cols-2 gap-2"><Num k="yearMin" label="Year from" /><Num k="yearMax" label="Year to" /></div>
          <div className="grid grid-cols-2 gap-2"><Num k="priceMin" label="Min price" /><Num k="priceMax" label="Max price" /></div>
          <Sel k="fuelType" label="Fuel" opts={FUELS} /><Sel k="transmission" label="Transmission" opts={TRANSMISSIONS} />
          <Num k="mileageMax" label="Max mileage (km)" /><div className="grid grid-cols-2 gap-2"><Num k="ccMin" label="Min cc" /><Num k="ccMax" label="Max cc" /></div>
          <Sel k="condition" label="Condition" opts={['New', 'Used', 'Reconditioned']} />
          <Sel k="importStatus" label="Import status" opts={[{ v: 'local', l: 'Local' }, { v: 'imported', l: 'Imported' }, { v: 'import-available', l: 'Available to import' }]} />
          <button className="btn-ghost w-full" onClick={() => setSp({})}>Clear filters</button>
        </aside>
        <div>
          {q.isLoading ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} />)}</div>
            : q.isError ? <ErrorState onRetry={q.refetch} />
            : !q.data.data.length ? <Empty title="No vehicles match your filters" hint="Try clearing some filters." />
            : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{q.data.data.map((v) => <VehicleCard key={v._id} v={v} />)}</div>}
          <Pager meta={q.data?.meta} onPage={(n) => set('page', n)} />
        </div>
      </div>
    </div>
  );
}
