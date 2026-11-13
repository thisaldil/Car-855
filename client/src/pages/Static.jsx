import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, CarFront, CheckCircle2, ClipboardCheck, Compass, FileCheck2, Handshake, Instagram, MapPin, Phone, Play, Search, ShieldCheck, Ship, Sparkles, Wrench } from 'lucide-react';
import { get, api, errMsg } from '../services/api.js';
import { useTitle, useSettings } from '../hooks/useSettings.js';
import { useForm } from 'react-hook-form';
import { Field } from '../components/ui.jsx';

const phones = ['077 747 7626', '071 562 6855', '071 762 6855'];
const instagram = 'https://www.instagram.com/cars_at_855?exln=MWZkNmV6cWg0YzQ4MA==';

const services = [
  [Search, 'Japanese auction sourcing', 'We search trusted auction channels for vehicles that match your preferred make, model, budget and condition.'],
  [CarFront, 'Quality local vehicles', 'Explore available stock with clear vehicle details and support before you make a decision.'],
  [Ship, 'Import coordination', 'From purchase approval to shipping, we keep the process organised and easy to follow.'],
  [FileCheck2, 'Customs guidance', 'Understand the documents, duties and steps involved in bringing your vehicle home.'],
  [ClipboardCheck, 'Vehicle inspection support', 'Make confident decisions with practical guidance on auction sheets, condition and history.'],
  [Handshake, 'Financing guidance', 'Plan your purchase with leasing and cost calculators designed around the Sri Lankan market.'],
];

const process = [
  ['01', 'Tell us what you want', 'Share your preferred vehicle, budget and must-have features.'],
  ['02', 'We search and shortlist', 'Our team reviews suitable Japanese auctions and available local vehicles.'],
  ['03', 'Review a clear quotation', 'You receive the key costs and next steps before making a commitment.'],
  ['04', 'We coordinate the journey', 'We support purchase, shipping, clearance and delivery through to handover.'],
];

const PAGES = {
  'import-process': ['Import Process', ['1. Submit an import request.', '2. We search and send a quotation.', '3. You approve; we purchase and ship.', '4. Customs clearance and delivery.']],
  financing: ['Financing Information', ['Use our leasing calculator as a planning tool. Confirm final rates, fees, insurance and approval terms directly with your chosen finance provider.']],
  inspection: ['Vehicle Inspection Information', ['We help you understand auction sheets, vehicle condition and inspection details before you proceed.']],
  privacy: ['Privacy Policy', ['Replace this text with a privacy policy reviewed by a qualified professional.']],
  terms: ['Terms and Conditions', ['Replace this text with terms reviewed by a qualified professional.']],
};

function PageHero({ eyebrow, title, copy, icon: Icon = Sparkles }) {
  return <section className="overflow-hidden bg-brand text-white">
    <div className="container-x relative py-14 sm:py-20">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
      <div className="relative max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-gold"><Icon size={14} />{eyebrow}</div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg">{copy}</p>
      </div>
    </div>
  </section>;
}

function ContactDetails() {
  return <div className="grid gap-3 sm:grid-cols-3">
    {phones.map((phone) => <a key={phone} href={`tel:${phone.replace(/\s/g, '')}`} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-gold"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-100 text-gold"><Phone size={17} /></span><span><span className="block text-xs text-gray-500">Call us</span><strong className="text-sm">{phone}</strong></span></a>)}
  </div>;
}

function Gallery() {
  const q = useQuery({ queryKey: ['gallery'], queryFn: () => get('/gallery').then((r) => r.data) });
  if (q.isLoading || q.isError || !q.data?.length) return null;
  return <section className="container-x py-14 sm:py-20">
    <div className="flex items-end justify-between gap-4">
      <div><p className="text-sm font-bold uppercase tracking-widest text-gold">Cars@855 moments</p><h2 className="mt-2 text-3xl font-extrabold">See us in motion.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">A glimpse of the vehicles, people and moments behind every journey.</p></div>
      <a href={instagram} target="_blank" rel="noreferrer" className="hidden items-center gap-2 text-sm font-bold text-gold sm:flex"><Instagram size={17} /> Instagram</a>
    </div>
    <div className="mt-8 columns-2 gap-3 sm:columns-3 lg:columns-4">
      {q.data.map((item) => <a key={item._id} href={item.url} target="_blank" rel="noreferrer" className="group relative mb-3 block overflow-hidden rounded-2xl bg-gray-100 break-inside-avoid">
        {item.type === 'video' ? <video src={item.url} muted loop autoPlay playsInline className="w-full object-cover transition duration-500 group-hover:scale-105" /> : <img src={item.url} alt={item.caption || 'Cars@855 gallery'} loading="lazy" className="w-full object-cover transition duration-500 group-hover:scale-105" />}
        {item.type === 'video' && <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white"><Play size={14} fill="currentColor" /></span>}
        {item.caption && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 text-xs font-medium text-white">{item.caption}</span>}
      </a>)}
    </div>
    <a href={instagram} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-gold sm:hidden"><Instagram size={17} /> Follow us on Instagram</a>
  </section>;
}

function ServicesPage() {
  return <>
    <PageHero eyebrow="What we do" title="A smoother way to find and import your next vehicle." copy="From the first search to the final handover, Cars@855 brings vehicle sourcing, import coordination and practical guidance together in one trusted experience." icon={Wrench} />
    <section className="container-x py-14 sm:py-16">
      <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-widest text-gold">Our expertise</p><h2 className="mt-2 text-3xl font-extrabold">Everything you need, without the guesswork.</h2><p className="mt-4 leading-7 text-gray-600">Whether you are browsing local stock or importing from Japan, our team helps you make informed decisions with clear communication at every stage.</p></div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{services.map(([Icon, title, copy]) => <article key={title} className="card group p-6 transition hover:-translate-y-1 hover:border-gold"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-100 text-gold transition group-hover:bg-gold group-hover:text-white"><Icon size={23} /></div><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-gray-500">{copy}</p></article>)}</div>
    </section>
    <section className="bg-gray-50"><div className="container-x py-14 sm:py-16"><div className="text-center"><p className="text-sm font-bold uppercase tracking-widest text-gold">How it works</p><h2 className="mt-2 text-3xl font-extrabold">A clear journey from search to keys.</h2></div><div className="mt-10 grid gap-5 md:grid-cols-4">{process.map(([number, title, copy]) => <div key={number} className="relative"><div className="text-4xl font-extrabold text-gold/30">{number}</div><h3 className="mt-2 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-gray-500">{copy}</p></div>)}</div></div></section>
    <section className="container-x py-14"><div className="rounded-3xl bg-gold-100 p-8 sm:flex sm:items-center sm:justify-between sm:p-10"><div><p className="text-sm font-bold uppercase tracking-widest text-gold-600">Ready when you are</p><h2 className="mt-2 text-2xl font-extrabold">Let&apos;s find your dream vehicle.</h2><p className="mt-2 text-sm text-gray-600">Start with our stock or tell us what you want imported from Japan.</p></div><Link to="/import" className="btn-dark mt-6 sm:mt-0">Start an import request <ArrowRight size={16} /></Link></div></section>
  </>;
}

function AboutPage() {
  return <>
    <PageHero eyebrow="Since 1985" title="Your dream vehicle. Our expertise." copy="Cars@855 is a trusted vehicle import and sales partner based at No. 855, Negombo. We combine experience, practical guidance and a customer-first process to make every purchase feel more confident." icon={BadgeCheck} />
    <Gallery />
    <section className="container-x grid gap-10 py-14 lg:grid-cols-[1.1fr_.9fr] lg:items-center sm:py-20"><div><p className="text-sm font-bold uppercase tracking-widest text-gold">Who we are</p><h2 className="mt-2 text-3xl font-extrabold">Quality, trust and experience in every conversation.</h2><p className="mt-5 leading-7 text-gray-600">For more than four decades, we have helped customers navigate vehicle choices with a straightforward approach: listen carefully, explain clearly and support the journey from the first enquiry to delivery.</p><p className="mt-4 leading-7 text-gray-600">Our goal is not simply to find a car. It is to help you choose the right vehicle for your needs, budget and confidence.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{['Customer-first guidance', 'Transparent next steps', 'Japan and local vehicle options', 'Support through the process'].map((item) => <div key={item} className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 size={18} className="text-gold" />{item}</div>)}</div></div><div className="rounded-3xl bg-brand p-8 text-white shadow-xl sm:p-10"><Sparkles className="text-gold" size={30} /><p className="mt-6 text-2xl font-extrabold leading-tight">Trusted Vehicle Imports Since 1985</p><p className="mt-4 text-sm leading-6 text-gray-300">Based in Negombo, serving customers who value a dependable vehicle journey.</p><div className="mt-8 flex items-center gap-2 text-sm text-gray-300"><MapPin size={17} className="text-gold" />No. 855, Negombo</div></div></section>
    <section className="bg-gray-50"><div className="container-x py-14 text-center sm:py-16"><p className="text-sm font-bold uppercase tracking-widest text-gold">Let&apos;s connect</p><h2 className="mt-2 text-3xl font-extrabold">Good vehicles start with a good conversation.</h2><p className="mx-auto mt-3 max-w-xl text-gray-600">Tell us what you are looking for and our team will help you take the next step.</p><Link to="/contact" className="btn-gold mt-6">Contact Cars@855 <ArrowRight size={16} /></Link></div></section>
  </>;
}

function ContactPage({ settings }) {
  const { register, handleSubmit, reset } = useForm();
  const [state, setState] = useState('');
  return <><PageHero eyebrow="We are here to help" title="Let&apos;s talk about your next vehicle." copy="Have a question about a vehicle, importing from Japan or planning your budget? Send us a message or call the Cars@855 team today." icon={Compass} />
    <section className="container-x grid gap-8 py-12 lg:grid-cols-[.8fr_1.2fr] sm:py-16"><div><p className="text-sm font-bold uppercase tracking-widest text-gold">Contact us today</p><h2 className="mt-2 text-3xl font-extrabold">Your next step is simple.</h2><p className="mt-4 leading-7 text-gray-600">We are ready to help you explore available vehicles, source a Japanese import or understand the process before you decide.</p><div className="mt-7 space-y-3">{phones.map((phone) => <a key={phone} href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-sm font-semibold hover:text-gold"><Phone size={18} className="text-gold" />{phone}</a>)}<div className="flex items-center gap-3 text-sm"><MapPin size={18} className="text-gold" />No. 855, Negombo</div><a href={instagram} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-semibold hover:text-gold"><Instagram size={18} className="text-gold" />@cars_at_855 on Instagram</a>{settings.email && <a href={`mailto:${settings.email}`} className="flex items-center gap-3 text-sm font-semibold hover:text-gold"><ShieldCheck size={18} className="text-gold" />{settings.email}</a>}</div></div><form onSubmit={handleSubmit(async (body) => { try { await api.post('/inquiries', { ...body, inquiryType: 'general' }); setState('Thank you. Our team will be in touch shortly.'); reset(); } catch (error) { setState(errMsg(error)); } })} className="card p-6 sm:p-8"><h3 className="text-xl font-bold">Send an enquiry</h3><p className="mt-1 text-sm text-gray-500">Tell us how we can help.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Name"><input className="input" required {...register('name')} /></Field><Field label="Email"><input type="email" className="input" required {...register('email')} /></Field><Field label="Phone"><input className="input" {...register('phone')} /></Field><Field label="What can we help with?"><select className="input" {...register('subject')}><option>Importing from Japan</option><option>Available vehicles</option><option>Leasing and finance</option><option>General enquiry</option></select></Field><div className="sm:col-span-2"><Field label="Message"><textarea rows={5} required minLength={5} className="input" {...register('message')} /></Field></div></div>{state && <p role="status" className="mt-4 rounded-lg bg-gold-100 p-3 text-sm text-gold-600">{state}</p>}<button className="btn-gold mt-5 w-full sm:w-auto">Send message <ArrowRight size={16} /></button></form></section></>;
}

export default function Static() {
  const { page } = useParams();
  const settings = useSettings();
  const faqs = useQuery({ queryKey: ['faqs'], queryFn: () => get('/faqs'), enabled: page === 'faq' });
  const title = page === 'services' ? 'Services' : page === 'about' ? 'About Us' : page === 'contact' ? 'Contact Us' : PAGES[page]?.[0] || (page === 'faq' ? 'FAQ' : 'Page not found');
  useTitle(title);
  if (page === 'services') return <ServicesPage />;
  if (page === 'about') return <AboutPage />;
  if (page === 'contact') return <ContactPage settings={settings} />;
  return <div className="container-x max-w-3xl py-12"><h1 className="text-3xl font-extrabold">{title}</h1>{PAGES[page]?.[1] && <div className="mt-5 space-y-3 text-gray-600">{PAGES[page][1].map((text) => <p key={text}>{text}</p>)}</div>}{page === 'faq' && <div className="mt-6 space-y-3">{faqs.data?.data.map((faq) => <details key={faq._id} className="card p-4"><summary className="cursor-pointer font-semibold">{faq.question}</summary><p className="mt-2 text-sm text-gray-600">{faq.answer}</p></details>)}</div>}{!PAGES[page] && page !== 'faq' && <Link to="/" className="btn-gold mt-6">Go home</Link>}</div>;
}
