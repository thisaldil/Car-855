import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, MessageCircle, Phone, Mail, User } from 'lucide-react';
import logo from '../assets/logo-dark.png';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSettings } from '../hooks/useSettings.js';

const links = [['/vehicles', 'Vehicles'], ['/auctions', 'Japan Auctions'], ['/import', 'Import a Car'], ['/calculator', 'Cost Calculator'], ['/services', 'Services'], ['/about', 'About'], ['/contact', 'Contact']];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout, isStaff } = useAuth();
  const s = useSettings();
  const nav = useNavigate();
  const cls = ({ isActive }) => `block rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'text-gold' : 'text-gray-200 hover:text-white'}`;
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 bg-brand shadow-lg">
        <div className="container-x flex h-16 items-center justify-between">
          <Link to="/"><img src={logo} alt="Cars@855" className="h-12 w-auto" /></Link>
          <nav className="hidden items-center gap-1 lg:flex">{links.map(([to, l]) => <NavLink key={to} to={to} className={cls}>{l}</NavLink>)}</nav>
          <div className="hidden items-center gap-2 lg:flex">
            {user ? <>
              <Link to={isStaff ? '/admin' : '/account'} className="btn-gold"><User size={16} />{isStaff ? 'Admin' : 'My Account'}</Link>
              <button className="text-sm text-gray-300 hover:text-white" onClick={async () => { await logout(); nav('/'); }}>Logout</button>
            </> : <><Link to="/login" className="text-sm font-semibold text-white">Login</Link><Link to="/register" className="btn-gold">Sign up</Link></>}
          </div>
          <button className="p-2 text-white lg:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
        {open && <div className="border-t border-white/10 px-4 pb-4 lg:hidden" onClick={() => setOpen(false)}>
          {links.map(([to, l]) => <NavLink key={to} to={to} className={cls}>{l}</NavLink>)}
          <div className="mt-3 flex gap-2">{user ? <Link to={isStaff ? '/admin' : '/account'} className="btn-gold flex-1">{isStaff ? 'Admin' : 'My Account'}</Link> : <><Link to="/login" className="btn-ghost flex-1">Login</Link><Link to="/register" className="btn-gold flex-1">Sign up</Link></>}</div>
        </div>}
      </header>
      <main className="flex-1"><Outlet /></main>
      {s.whatsapp && <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello Cars@855, I would like some information.')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-green-500 text-white shadow-xl"><MessageCircle /></a>}
      <footer className="bg-brand text-gray-300">
        <div className="container-x grid gap-8 py-12 md:grid-cols-4">
          <div><img src={logo} alt="Cars@855" className="h-14" /><p className="mt-3 text-sm">Quality vehicles from Japan and Sri Lanka, with transparent import support.</p></div>
          <div><h4 className="mb-3 font-bold text-white">Explore</h4>{[['/vehicles', 'Vehicle Stock'], ['/auctions', 'Auction Vehicles'], ['/calculator', 'Cost Calculator'], ['/faq', 'FAQ']].map(([t, l]) => <Link key={t} to={t} className="block py-1 text-sm hover:text-gold">{l}</Link>)}</div>
          <div><h4 className="mb-3 font-bold text-white">Company</h4>{[['/about', 'About Us'], ['/import-process', 'Import Process'], ['/financing', 'Financing'], ['/inspection', 'Vehicle Inspection'], ['/privacy', 'Privacy Policy'], ['/terms', 'Terms & Conditions']].map(([t, l]) => <Link key={t} to={t} className="block py-1 text-sm hover:text-gold">{l}</Link>)}</div>
          <div><h4 className="mb-3 font-bold text-white">Contact</h4>
            {s.phone && <a href={`tel:${s.phone}`} className="flex items-center gap-2 py-1 text-sm hover:text-gold"><Phone size={14} />{s.phone}</a>}
            {s.email && <a href={`mailto:${s.email}`} className="flex items-center gap-2 py-1 text-sm hover:text-gold"><Mail size={14} />{s.email}</a>}
            {s.address && <p className="py-1 text-sm">{s.address}</p>}
            {!s.phone && !s.email && !s.address && <p className="text-sm text-gray-500">Contact details are managed in the admin dashboard.</p>}
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-gray-500">© {new Date().getFullYear()} Cars@855. All rights reserved.</div>
      </footer>
    </div>
  );
}
