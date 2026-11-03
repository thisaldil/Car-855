import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { get } from '../services/api.js';
import { useTitle } from '../hooks/useSettings.js';
import { Skeleton, Empty, ErrorState, Badge } from '../components/ui.jsx';
import { date, num } from '../utils/format.js';

export default function Auctions() {
  useTitle('Japanese Auction Vehicles');
  const q = useQuery({ queryKey: ['auctions'], queryFn: () => get('/auctions', { limit: 60 }) });
  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-extrabold">Japanese Auction Vehicles</h1>
      <p className="mt-1 max-w-2xl text-sm text-gray-500">Listings curated by our team. These are managed manually and are not a live feed from an auction provider.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {q.isLoading ? [...Array(3)].map((_, i) => <Skeleton key={i} />) : q.isError ? <ErrorState /> : !q.data.data.length ? <div className="col-span-full"><Empty title="No auction vehicles listed right now" /></div> :
          q.data.data.map((a) => (
            <div key={a._id} className="card overflow-hidden">
              <div className="aspect-[4/3] bg-gray-100">{a.images?.[0] && <img src={a.images[0].url} alt="" loading="lazy" className="h-full w-full object-cover" />}</div>
              <div className="p-4"><div className="flex justify-between"><h3 className="font-bold">{a.make} {a.model}</h3><Badge tone={a.availability === 'open' ? 'green' : 'gray'}>{a.availability}</Badge></div>
                <p className="text-xs text-gray-500">{a.manufacturingYear} · Grade {a.auctionGrade || '—'} · {num(a.mileage, ' km')} · {num(a.engineCapacity, ' cc')}</p>
                <p className="mt-2 text-sm">{a.auctionHouse} · {date(a.auctionDate)}</p>
                <p className="mt-2 text-sm">Starting bid: <b>{a.currency} {num(a.startingBid)}</b></p>
                {a.estimatedLandedCost && <p className="text-sm">Est. landed cost: <b>LKR {num(a.estimatedLandedCost)}</b></p>}
                <Link to={`/import?auction=${a._id}&make=${encodeURIComponent(a.make)}&model=${encodeURIComponent(a.model)}&year=${a.manufacturingYear || ''}`} className="btn-gold mt-3 w-full">Request this vehicle</Link></div>
            </div>))}
      </div>
    </div>
  );
}
