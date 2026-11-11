import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ShieldCheck, Ship, Calculator, FileText, Truck, Star } from 'lucide-react';
import { get } from '../services/api.js';
import { useSettings, useTitle } from '../hooks/useSettings.js';
import VehicleCard from '../components/VehicleCard.jsx';
import { Skeleton } from '../components/ui.jsx';
import { useState } from 'react';

// Module-level, so the intro plays once per full page load/refresh, not on every in-app navigation
let introShown = false;

const steps = [[Search, 'Tell us what you want', 'Submit an import request with your budget and preferences.'], [FileText, 'We source & quote', 'We search auctions and suppliers and send a clear quotation.'], [Ship, 'Purchase & ship', 'After your approval we buy the vehicle and arrange shipping.'], [Truck, 'Clear & deliver', 'We help with customs clearance and delivery to you.']];

export default function Home() {
  useTitle('Vehicle Imports & Sales in Sri Lanka', 'Discover quality vehicles from Japan and Sri Lanka with transparent pricing and trusted import support.');
  const s = useSettings(); const nav = useNavigate(); const [q, setQ] = useState('');
  const [hasVideo] = useState(!introShown); // video is only mounted on a fresh page load
  const [done, setDone] = useState(introShown);
  const endIntro = () => { introShown = true; setDone(true); };
  const featured = useQuery({ queryKey: ['featured'], queryFn: () => get('/vehicles', { featured: true, limit: 8 }) });
  const latest = useQuery({ queryKey: ['latest'], queryFn: () => get('/vehicles', { limit: 8, availabilityStatus: 'available' }) });
  const faqs = useQuery({ queryKey: ['faqs'], queryFn: () => get('/faqs') });
  const tests = useQuery({ queryKey: ['tests'], queryFn: () => get('/testimonials') });
  const grid = (qr) => qr.isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} />)}</div>
    : qr.data?.data?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{qr.data.data.map((v) => <VehicleCard key={v._id} v={v} />)}</div> : <p className="text-sm text-gray-500">No vehicles listed yet.</p>;
  return (<>
    <section className="overflow-hidden bg-gradient-to-br from-brand-900 via-brand to-brand-700 text-white">
      <div className={`container-x grid items-center grid-cols-1 gap-y-6 py-10 transition-[grid-template-columns,column-gap,min-height] duration-1000 ease-in-out ${done ? 'lg:grid-cols-[1fr_0fr] gap-x-0 min-h-[36rem]' : 'lg:grid-cols-[1fr_1fr] lg:gap-x-8 min-h-[calc(100svh-4rem)]'}`}>
        <div className="min-w-0">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">Japan · Sri Lanka · Trusted</p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">{s.heroTitle || 'Your Dream Car, Imported with Confidence'}</h1>
          <p className="mt-5 max-w-2xl text-lg text-gray-300">{s.heroSubtitle || 'Discover quality vehicles from Japan and Sri Lanka. Get transparent pricing, trusted import support, and a smooth vehicle purchasing experience.'}</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/vehicles" className="btn-gold">Browse Vehicles</Link><Link to="/import" className="btn bg-white/10 text-white hover:bg-white/20">Import a Vehicle</Link></div>
          {/* search slides/fades in once the intro is over */}
          <div className="grid transition-all duration-1000 ease-in-out" style={{ gridTemplateRows: done ? '1fr' : '0fr', opacity: done ? 1 : 0 }}>
            <div className="overflow-hidden">
              <form onSubmit={(e) => { e.preventDefault(); nav(`/vehicles?q=${encodeURIComponent(q)}`); }} className="mt-10 flex max-w-2xl gap-2 rounded-xl bg-white p-2 shadow-xl">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search make, model or keyword (e.g. Toyota Aqua)" className="min-w-0 flex-1 rounded-lg px-3 text-sm text-brand outline-none" tabIndex={done ? 0 : -1} />
                <button className="btn-gold" tabIndex={done ? 0 : -1}><Search size={16} />Search</button>
              </form>
            </div>
          </div>
        </div>
        {hasVideo && <div className={`min-w-0 overflow-hidden transition-[max-height] duration-1000 ease-in-out ${done ? 'max-h-0 lg:max-h-none' : 'max-h-[70vw] lg:max-h-none'}`} aria-hidden="true">
          {/* lighten blend: the video's near-black backdrop takes on the hero background, so no box is visible; edges are feathered by the mask */}
          <video src="/intro.mp4" autoPlay muted playsInline preload="auto" onEnded={endIntro} onError={endIntro}
            className="pointer-events-none block w-full transition-opacity duration-700 ease-in-out"
            style={{ mixBlendMode: 'lighten', opacity: done ? 0 : 1, WebkitMaskImage: 'radial-gradient(ellipse 72% 72% at 50% 50%, #000 62%, transparent 100%)', maskImage: 'radial-gradient(ellipse 72% 72% at 50% 50%, #000 62%, transparent 100%)' }} />
        </div>}
      </div>
    </section>
    <section className="container-x py-14"><div className="mb-6 flex flex-wrap items-end justify-between gap-2"><h2 className="h-section">Featured Vehicles</h2><Link to="/vehicles" className="text-sm font-semibold text-gold">View all →</Link></div>{grid(featured)}</section>
    <section className="bg-gray-50"><div className="container-x py-14"><h2 className="h-section mb-6">Available Stock</h2>{grid(latest)}</div></section>
    <section className="container-x py-14">
      <div className="text-center"><h2 className="h-section">Import from Japan, Step by Step</h2><p className="mx-auto mt-2 max-w-xl text-gray-500">You don't need to understand auctions. We handle it end to end.</p></div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{steps.map(([I, t, d], i) => <div key={t} className="card p-6"><div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gold-100 text-gold"><I size={20} /></div><p className="text-xs font-bold text-gold">STEP {i + 1}</p><h3 className="font-bold">{t}</h3><p className="mt-1 text-sm text-gray-500">{d}</p></div>)}</div>
    </section>
    <section className="bg-brand text-white"><div className="container-x flex flex-col items-start gap-5 py-12 md:flex-row md:items-center md:justify-between">
      <div><h2 className="text-2xl font-extrabold"><Calculator className="mr-2 inline text-gold" />Estimate your import cost</h2><p className="mt-1 text-gray-300">Use our configurable calculator for an estimated landed cost.</p></div>
      <Link to="/calculator" className="btn-gold">Open Calculator</Link></div></section>
    <section className="container-x py-14"><h2 className="h-section mb-6 text-center">Why Choose Cars@855</h2>
      <div className="grid gap-5 md:grid-cols-3">{[['Transparent pricing', 'Clear quotations that break down vehicle price, shipping and taxes.'], ['Real-time tracking', 'Follow every stage of your import from your own dashboard.'], ['Dedicated support', 'A named staff member handles your request from start to finish.']].map(([t, d]) => <div key={t} className="card p-6"><ShieldCheck className="text-gold" /><h3 className="mt-2 font-bold">{t}</h3><p className="mt-1 text-sm text-gray-500">{d}</p></div>)}</div></section>
    {tests.data?.data?.length > 0 && <section className="bg-gray-50"><div className="container-x py-14"><h2 className="h-section mb-6">What Customers Say</h2><div className="grid gap-5 md:grid-cols-3">{tests.data.data.slice(0, 3).map((t) => <div key={t._id} className="card p-6"><div className="flex text-gold">{[...Array(t.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}</div><p className="mt-3 text-sm">“{t.quote}”</p><p className="mt-3 text-sm font-bold">{t.name}<span className="font-normal text-gray-500"> {t.location}</span></p></div>)}</div></div></section>}
    {faqs.data?.data?.length > 0 && <section className="container-x py-14"><h2 className="h-section mb-6">Frequently Asked Questions</h2><div className="space-y-3">{faqs.data.data.map((f) => <details key={f._id} className="card p-4"><summary className="cursor-pointer font-semibold">{f.question}</summary><p className="mt-2 text-sm text-gray-600">{f.answer}</p></details>)}</div></section>}
    <section className="bg-gold-100"><div className="container-x flex flex-col items-start gap-4 py-12 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-extrabold">Have a question?</h2><p className="text-gray-600">Talk to our team about buying or importing a vehicle.</p></div><Link to="/contact" className="btn-dark">Contact Us</Link></div></section>
  </>);
}