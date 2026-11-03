import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { get } from '../services/api.js';
import { useTitle, useSettings } from '../hooks/useSettings.js';
import { useForm } from 'react-hook-form';
import { api, errMsg } from '../services/api.js';
import { Field } from '../components/ui.jsx';
import { useState } from 'react';

// Placeholder copy. Replace with the company's real, reviewed content (legal pages in particular).
const PAGES = {
  about: ['About Us', ['Cars@855 helps customers in Sri Lanka buy quality vehicles locally and import vehicles from Japan.', 'Add your company story, team and credentials here.']],
  services: ['Our Services', ['Local vehicle sales', 'Japanese auction sourcing and import', 'Customs clearance assistance', 'Financing guidance', 'Pre-purchase inspection information']],
  'import-process': ['Import Process', ['1. Submit an import request.', '2. We search and send a quotation.', '3. You approve; we purchase and ship.', '4. Customs clearance and delivery.']],
  financing: ['Financing Information', ['Describe the financing and leasing options you work with. Do not publish rates unless they are confirmed with your partners.']],
  inspection: ['Vehicle Inspection Information', ['Describe your inspection checklist and the reports customers receive.']],
  privacy: ['Privacy Policy', ['Replace this text with a privacy policy reviewed by a qualified professional.']],
  terms: ['Terms and Conditions', ['Replace this text with terms reviewed by a qualified professional.']],
};
export default function Static() {
  const { page } = useParams(); const s = useSettings();
  const [title, body] = PAGES[page] || (page === 'faq' ? ['FAQ'] : page === 'contact' ? ['Contact Us'] : ['Page not found', ['The page you are looking for does not exist.']]);
  useTitle(title);
  const faqs = useQuery({ queryKey: ['faqs'], queryFn: () => get('/faqs'), enabled: page === 'faq' });
  const { register, handleSubmit, reset } = useForm(); const [state, setState] = useState('');
  return (
    <div className="container-x max-w-3xl py-12">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      {body && <div className="mt-5 space-y-3 text-gray-600">{body.map((t) => <p key={t}>{t}</p>)}</div>}
      {page === 'faq' && <div className="mt-6 space-y-3">{faqs.data?.data.map((f) => <details key={f._id} className="card p-4"><summary className="cursor-pointer font-semibold">{f.question}</summary><p className="mt-2 text-sm text-gray-600">{f.answer}</p></details>)}</div>}
      {page === 'contact' && <>
        <div className="mt-4 text-sm text-gray-600">{s.phone && <p>Phone: <a className="text-gold" href={`tel:${s.phone}`}>{s.phone}</a></p>}{s.email && <p>Email: <a className="text-gold" href={`mailto:${s.email}`}>{s.email}</a></p>}{s.address && <p>{s.address}</p>}</div>
        <form onSubmit={handleSubmit(async (b) => { try { await api.post('/inquiries', { ...b, inquiryType: 'general' }); setState('Thank you, we will be in touch.'); reset(); } catch (e) { setState(errMsg(e)); } })} className="card mt-6 space-y-3 p-6">
          <Field label="Name"><input className="input" required {...register('name')} /></Field><Field label="Email"><input type="email" className="input" required {...register('email')} /></Field>
          <Field label="Phone"><input className="input" {...register('phone')} /></Field><Field label="Message"><textarea rows={5} required minLength={5} className="input" {...register('message')} /></Field>
          {state && <p className="text-sm">{state}</p>}<button className="btn-gold">Send message</button></form></>}
      {!PAGES[page] && !['faq', 'contact'].includes(page) && <Link to="/" className="btn-gold mt-6">Go home</Link>}
    </div>
  );
}
