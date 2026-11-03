import { Link } from 'react-router-dom';
import { Fuel, Gauge, Cog } from 'lucide-react';
import { lkr, num, waLink } from '../utils/format.js';
import { Badge } from './ui.jsx';
import { useSettings } from '../hooks/useSettings.js';

export default function VehicleCard({ v }) {
  const s = useSettings();
  const wa = waLink(s.whatsapp, `Hello, I am interested in the ${v.make} ${v.model} ${v.manufacturingYear} listed on your website. Could you please provide more information?`);
  const tone = { available: 'green', reserved: 'gold', sold: 'red' }[v.availabilityStatus];
  return (
    <div className="card overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/vehicles/${v.slug}`} className="relative block aspect-[4/3] bg-gray-100">
        {v.images?.[0] ? <img src={v.images[0].url} alt={v.title} loading="lazy" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-gray-400">No photo</div>}
        <div className="absolute left-3 top-3 flex gap-2"><Badge tone={tone}>{v.availabilityStatus}</Badge>{v.importStatus !== 'local' && <Badge tone="blue">Imported</Badge>}</div>
      </Link>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase text-gold">{v.make} · {v.manufacturingYear}{v.registrationYear ? ` / Reg. ${v.registrationYear}` : ''}</p>
        <h3 className="mt-1 line-clamp-1 font-bold">{v.model} {v.variant}</h3>
        <p className="mt-2 text-xl font-extrabold">{lkr(v.sellingPrice)}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-600">
          <span className="flex items-center gap-1"><Gauge size={14} />{num(v.mileage, ' km')}</span>
          <span className="flex items-center gap-1"><Fuel size={14} />{v.fuelType || '—'}</span>
          <span className="flex items-center gap-1"><Cog size={14} />{v.transmission || '—'}</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">{v.engineCapacity ? `${num(v.engineCapacity)} cc` : ''}</p>
        <div className="mt-4 flex gap-2">
          <Link to={`/vehicles/${v.slug}`} className="btn-dark flex-1">View Details</Link>
          {wa ? <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost flex-1">Contact Seller</a> : <Link to={`/vehicles/${v.slug}#inquiry`} className="btn-ghost flex-1">Contact Seller</Link>}
        </div>
      </div>
    </div>
  );
}
