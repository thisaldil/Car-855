import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Heart, Phone, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { api, get, errMsg } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSettings, useTitle } from '../hooks/useSettings.js';
import { lkr, num, date, waLink } from '../utils/format.js';
import { Skeleton, ErrorState, Field, Badge } from '../components/ui.jsx';
import VehicleCard from '../components/VehicleCard.jsx';

const schema = z.object({ inquiryType: z.enum(['general', 'quotation', 'details', 'test-drive']), name: z.string().min(2, 'Required'), email: z.string().email(), phone: z.string().optional(), message: z.string().min(5, 'Please write a short message') });
const Spec = ({ k, v }) => v ? <div className="flex justify-between border-b border-gray-100 py-2 text-sm"><span className="text-gray-500">{k}</span><span className="font-medium">{v}</span></div> : null;
const List = ({ title, items }) => items?.length ? <div><h4 className="mb-2 font-bold">{title}</h4><ul className="flex flex-wrap gap-2">{items.map((i) => <li key={i} className="rounded-full bg-gray-100 px-3 py-1 text-xs">{i}</li>)}</ul></div> : null;

export default function VehicleDetail() {
  const { slug } = useParams(); const { user } = useAuth(); const s = useSettings();
  const [img, setImg] = useState(0); const [sent, setSent] = useState(false); const [fav, setFav] = useState(null);
  const q = useQuery({ queryKey: ['vehicle', slug], queryFn: () => get(`/vehicles/${slug}`) });
  const v = q.data?.data;
  useTitle(v?.title, v?.description?.slice(0, 150));
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { inquiryType: 'general', name: user?.name, email: user?.email, phone: user?.phone } });
  const send = useMutation({ mutationFn: (b) => api.post('/inquiries', { ...b, vehicle: v._id }), onSuccess: () => setSent(true) });
  const toggleFav = async () => { try { await api.post('/favorites', { vehicle: v._id }); setFav(true); } catch (e) { alert(user ? errMsg(e) : 'Please log in to save favorites.'); } };
  if (q.isLoading) return <div className="container-x py-8"><Skeleton className="h-96" /></div>;
  if (q.isError) return <div className="container-x py-8"><ErrorState message="Vehicle not found." /></div>;
  const wa = waLink(s.whatsapp, `Hello, I am interested in the ${v.make} ${v.model} ${v.manufacturingYear} listed on your website. Could you please provide more information?`);
  const d = v.dimensions || {};
  return (
    <div className="container-x py-8">
      <p className="mb-4 text-sm text-gray-500"><Link to="/vehicles" className="hover:text-gold">Vehicles</Link> / {v.make} / {v.model}</p>
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">{v.images?.[img] ? <img src={v.images[img].url} alt={v.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-gray-400">No photo</div>}</div>
          {v.images?.length > 1 && <div className="mt-3 grid grid-cols-5 gap-2">{v.images.map((im, i) => <button key={i} onClick={() => setImg(i)} className={`aspect-[4/3] overflow-hidden rounded-lg border-2 ${i === img ? 'border-gold' : 'border-transparent'}`}><img src={im.url} loading="lazy" alt="" className="h-full w-full object-cover" /></button>)}</div>}
          <div className="card mt-6 space-y-6 p-6">
            <div><h2 className="mb-2 text-lg font-bold">Overview</h2><p className="whitespace-pre-line text-sm text-gray-600">{v.description || 'No description provided.'}</p></div>
            <div className="grid gap-x-8 md:grid-cols-2">
              <div><h3 className="mb-1 font-bold">Specifications</h3><Spec k="Make" v={v.make} /><Spec k="Model" v={v.model} /><Spec k="Variant" v={v.variant} /><Spec k="Manufacturing year" v={v.manufacturingYear} /><Spec k="Registration" v={v.registrationYear && `${v.registrationYear}${v.registrationMonth ? '/' + v.registrationMonth : ''}`} /><Spec k="Body type" v={v.bodyType} /><Spec k="Colour" v={v.exteriorColor} /><Spec k="Interior" v={v.interiorColor} /><Spec k="Seats" v={v.seatingCapacity} /><Spec k="Doors" v={v.numberOfDoors} /></div>
              <div><h3 className="mb-1 font-bold">Engine & Transmission</h3><Spec k="Engine" v={v.engineCapacity && `${num(v.engineCapacity)} cc`} /><Spec k="Fuel" v={v.fuelType} /><Spec k="Transmission" v={v.transmission} /><Spec k="Drivetrain" v={v.drivetrain} /><Spec k="Power" v={v.horsepower && `${v.horsepower} hp`} /><Spec k="Torque" v={v.torque && `${v.torque} Nm`} /><Spec k="Mileage" v={v.mileage != null && num(v.mileage, ' km')} /><Spec k="Fuel economy" v={v.fuelEconomy} />
                {(d.length || d.width || d.height) && <><h3 className="mb-1 mt-4 font-bold">Dimensions</h3><Spec k="L × W × H (mm)" v={`${d.length || '—'} × ${d.width || '—'} × ${d.height || '—'}`} /><Spec k="Wheelbase" v={d.wheelbase && `${d.wheelbase} mm`} /></>}</div>
            </div>
            <div className="space-y-4"><List title="Safety" items={v.safetyFeatures} /><List title="Comfort" items={v.comfortFeatures} /><List title="Technology" items={v.technologyFeatures} /><List title="Exterior" items={v.exteriorFeatures} /><List title="Interior" items={v.interiorFeatures} /></div>
            <div className="grid gap-x-8 md:grid-cols-2"><div><h3 className="mb-1 font-bold">Condition</h3><Spec k="Condition" v={v.condition} /><Spec k="Accident history" v={v.accidentHistory} /><Spec k="Service history" v={v.serviceHistory} /><Spec k="Previous owners" v={v.previousOwners} /><Spec k="Inspection" v={v.inspectionStatus} /><Spec k="Warranty" v={v.warranty} /></div>
              {v.importStatus !== 'local' && <div><h3 className="mb-1 font-bold">Import details</h3><Spec k="Status" v={v.importStatus} /><Spec k="Origin" v={v.countryOfOrigin} /><Spec k="Auction grade" v={v.auctionGrade} /><Spec k="Auction house" v={v.auctionHouse} /><Spec k="Auction date" v={v.auctionDate && date(v.auctionDate)} /></div>}</div>
          </div>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-6">
            <div className="flex gap-2"><Badge tone={{ available: 'green', reserved: 'gold', sold: 'red' }[v.availabilityStatus]}>{v.availabilityStatus}</Badge>{v.condition && <Badge>{v.condition}</Badge>}</div>
            <h1 className="mt-2 text-2xl font-extrabold">{v.title}</h1>
            <p className="mt-2 text-3xl font-extrabold text-gold">{lkr(v.sellingPrice)}</p>
            {v.depositAmount && <p className="text-sm text-gray-500">Deposit: {lkr(v.depositAmount)}</p>}
            <div className="mt-4 grid gap-2">
              <a href="#inquiry" className="btn-gold">Request a Quotation</a>
              {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost"><MessageCircle size={16} />WhatsApp</a>}
              {s.phone && <a href={`tel:${s.phone}`} className="btn-ghost"><Phone size={16} />Call</a>}
              <button onClick={toggleFav} className="btn-ghost"><Heart size={16} fill={fav ? 'currentColor' : 'none'} />{fav ? 'Saved' : 'Add to favorites'}</button>
            </div>
          </div>
          <form id="inquiry" onSubmit={handleSubmit((b) => send.mutate(b))} className="card space-y-3 p-6">
            <h3 className="font-bold">Send an inquiry</h3>
            {sent ? <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Thanks! We have received your inquiry and will be in touch.</p> : <>
              <Field label="I want to"><select className="input" {...register('inquiryType')}><option value="general">Contact the company</option><option value="quotation">Request a quotation</option><option value="details">Ask for more details</option><option value="test-drive">Request a test drive</option></select></Field>
              <Field label="Name" error={errors.name}><input className="input" {...register('name')} /></Field>
              <Field label="Email" error={errors.email}><input className="input" {...register('email')} /></Field>
              <Field label="Phone"><input className="input" {...register('phone')} /></Field>
              <Field label="Message" error={errors.message}><textarea rows={4} className="input" {...register('message')} /></Field>
              {send.isError && <p className="text-sm text-red-600">{errMsg(send.error)}</p>}
              <button className="btn-dark w-full" disabled={send.isPending}>{send.isPending ? 'Sending…' : 'Send inquiry'}</button></>}
          </form>
        </aside>
      </div>
      {q.data.related?.length > 0 && <section className="mt-12"><h2 className="h-section mb-5">Related Vehicles</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{q.data.related.map((r) => <VehicleCard key={r._id} v={r} />)}</div></section>}
    </div>
  );
}
