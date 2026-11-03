import { NavLink, Routes, Route, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { api, get, errMsg } from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTitle } from '../../hooks/useSettings.js';
import { Spinner, Empty, ErrorState, Badge, Field } from '../../components/ui.jsx';
import VehicleCard from '../../components/VehicleCard.jsx';
import { IMPORT_STATUSES, date, lkr } from '../../utils/format.js';

const tabs = [['', 'Overview'], ['profile', 'Profile'], ['inquiries', 'Inquiries'], ['imports', 'Import Requests'], ['favorites', 'Favorites'], ['quotations', 'Quotations'], ['notifications', 'Notifications'], ['settings', 'Settings']];
const useList = (key, url) => useQuery({ queryKey: [key], queryFn: () => get(url, { limit: 50 }) });
const Wrap = ({ q, children }) => q.isLoading ? <Spinner /> : q.isError ? <ErrorState onRetry={q.refetch} /> : children(q.data.data, q.data.meta);

export function Tracker({ status, history = [] }) {
  const steps = IMPORT_STATUSES.filter((s) => s !== 'Cancelled');
  if (status === 'Cancelled') return <Badge tone="red">Cancelled</Badge>;
  const idx = steps.indexOf(status);
  return <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{steps.map((s, i) => {
    const h = history.find((x) => x.status === s);
    return <li key={s} className={`rounded-lg border p-2 text-xs ${i < idx ? 'border-green-200 bg-green-50' : i === idx ? 'border-gold bg-gold-100 font-bold' : 'border-gray-200 text-gray-400'}`}>
      <span className="flex items-center gap-1">{i < idx && <Check size={12} className="text-green-600" />}{s}</span>{h && <span className="block text-[10px] text-gray-500">{date(h.at)}</span>}</li>;
  })}</ol>;
}

function Overview() {
  const { user } = useAuth(); const imp = useList('my-imports', '/import-requests'); const inq = useList('my-inquiries', '/inquiries');
  return <div><h2 className="text-xl font-bold">Hello, {user.name}</h2>
    {!user.emailVerified && <p className="mt-2 rounded-lg bg-gold-100 p-3 text-sm">Please verify your email address using the link we sent you.</p>}
    <div className="mt-4 grid gap-4 sm:grid-cols-3">{[['Import requests', imp.data?.meta?.total], ['Inquiries', inq.data?.meta?.total]].map(([k, v]) => <div key={k} className="card p-5"><p className="text-sm text-gray-500">{k}</p><p className="text-3xl font-extrabold">{v ?? '…'}</p></div>)}
      <Link to="/import" className="card grid place-items-center p-5 font-semibold text-gold">+ New import request</Link></div></div>;
}
function Imports() {
  const q = useList('my-imports', '/import-requests'); const qc = useQueryClient();
  const cancel = useMutation({ mutationFn: (id) => api.patch(`/import-requests/${id}/cancel`), onSuccess: () => qc.invalidateQueries({ queryKey: ['my-imports'] }), onError: (e) => alert(errMsg(e)) });
  const upload = async (id, file) => { const f = new FormData(); f.append('file', file); try { await api.post(`/uploads/import-documents/${id}`, f); alert('Uploaded'); qc.invalidateQueries({ queryKey: ['my-imports'] }); } catch (e) { alert(errMsg(e)); } };
  return <Wrap q={q}>{(items) => !items.length ? <Empty title="No import requests yet" hint="Submit a request and track its progress here." /> :
    <div className="space-y-4">{items.map((r) => <div key={r._id} className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs text-gray-500">{r.requestNo} · {date(r.createdAt)}</p><h3 className="font-bold">{r.preferredVehicle?.make} {r.preferredVehicle?.model} {r.preferredVehicle?.manufacturingYear}</h3></div><Badge tone="gold">{r.status}</Badge></div>
      <Tracker status={r.status} history={r.progressHistory} />
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm"><label className="btn-ghost cursor-pointer">Upload document<input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => e.target.files[0] && upload(r._id, e.target.files[0])} /></label>
        {IMPORT_STATUSES.indexOf(r.status) < IMPORT_STATUSES.indexOf('Vehicle Purchased') && <button className="text-red-600" onClick={() => confirm('Cancel this request?') && cancel.mutate(r._id)}>Cancel request</button>}</div>
    </div>)}</div>}</Wrap>;
}
function Inquiries() {
  const q = useList('my-inquiries', '/inquiries');
  return <Wrap q={q}>{(items) => !items.length ? <Empty title="No inquiries yet" /> : <div className="space-y-3">{items.map((i) => <div key={i._id} className="card p-4"><div className="flex justify-between"><b>{i.vehicle?.title || 'General inquiry'}</b><Badge>{i.status}</Badge></div><p className="mt-1 text-sm text-gray-600">{i.message}</p><p className="mt-1 text-xs text-gray-400">{date(i.createdAt)}</p></div>)}</div>}</Wrap>;
}
function Favorites() {
  const q = useQuery({ queryKey: ['favs'], queryFn: () => get('/favorites') }); const qc = useQueryClient();
  return q.isLoading ? <Spinner /> : !q.data.data.length ? <Empty title="No favorites yet" /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{q.data.data.map((f) => <div key={f._id}><VehicleCard v={f.vehicle} /><button className="mt-1 text-xs text-red-600" onClick={async () => { await api.delete(`/favorites/${f.vehicle._id}`); qc.invalidateQueries({ queryKey: ['favs'] }); }}>Remove</button></div>)}</div>;
}
function Quotations() {
  const q = useList('my-quotes', '/quotations'); const qc = useQueryClient();
  const act = async (id, status) => { try { await api.patch(`/quotations/${id}/status`, { status }); qc.invalidateQueries({ queryKey: ['my-quotes'] }); } catch (e) { alert(errMsg(e)); } };
  return <Wrap q={q}>{(items) => !items.length ? <Empty title="No quotations yet" /> : <div className="space-y-3">{items.map((x) => <div key={x._id} className="card p-5">
    <div className="flex justify-between"><b>{x.quoteNo}</b><Badge tone="gold">{x.status}</Badge></div><p className="text-sm text-gray-500">{x.vehicle?.title}</p>
    <div className="mt-2 text-sm">Vehicle {lkr(x.vehiclePrice)} · Shipping {lkr(x.shippingCost)} · Taxes {lkr(x.taxes)} · Other {lkr(x.otherCharges)}</div>
    <p className="mt-1 text-lg font-extrabold">{lkr(x.totalPrice)} <span className="text-xs font-normal text-gray-500">valid {x.validityPeriod} days from {date(x.createdAt)}</span></p>
    {x.status === 'sent' && <div className="mt-3 flex gap-2"><button className="btn-gold" onClick={() => act(x._id, 'accepted')}>Accept</button><button className="btn-ghost" onClick={() => act(x._id, 'rejected')}>Decline</button></div>}</div>)}</div>}</Wrap>;
}
function Notifications() {
  const q = useList('notes', '/notifications'); const qc = useQueryClient();
  return <Wrap q={q}>{(items, meta) => <div><button className="mb-3 text-sm text-gold" onClick={async () => { await api.patch('/notifications/read-all'); qc.invalidateQueries({ queryKey: ['notes'] }); }}>Mark all read</button>
    {!items.length ? <Empty title="No notifications" /> : <div className="space-y-2">{items.map((n) => <div key={n._id} className={`card p-3 text-sm ${n.read ? '' : 'border-gold'}`}><b>{n.title}</b><p className="text-gray-600">{n.message}</p><p className="text-xs text-gray-400">{date(n.createdAt)}</p></div>)}</div>}</div>}</Wrap>;
}
function Profile() {
  const { user, setUser } = useAuth(); const { register, handleSubmit } = useForm({ defaultValues: { name: user.name, phone: user.phone } }); const [m, setM] = useState('');
  return <form onSubmit={handleSubmit(async (b) => { try { const r = await api.put('/auth/profile', b); setUser(r.data.data); setM('Saved'); } catch (e) { setM(errMsg(e)); } })} className="card max-w-md space-y-3 p-6">
    <Field label="Name"><input className="input" {...register('name')} /></Field><Field label="Email"><input className="input" value={user.email} disabled /></Field><Field label="Phone"><input className="input" {...register('phone')} /></Field>{m && <p className="text-sm">{m}</p>}<button className="btn-gold">Save</button></form>;
}
function Settings() {
  const { register, handleSubmit, reset } = useForm(); const [m, setM] = useState('');
  return <form onSubmit={handleSubmit(async (b) => { try { await api.put('/auth/password', b); setM('Password changed'); reset(); } catch (e) { setM(errMsg(e)); } })} className="card max-w-md space-y-3 p-6"><h3 className="font-bold">Change password</h3>
    <Field label="Current password"><input type="password" className="input" {...register('currentPassword')} /></Field><Field label="New password"><input type="password" className="input" {...register('newPassword')} /></Field>{m && <p className="text-sm">{m}</p>}<button className="btn-dark">Update</button></form>;
}
export default function Account() {
  useTitle('My Account');
  return <div className="container-x grid gap-6 py-8 lg:grid-cols-[220px_1fr]">
    <nav className="card flex gap-1 overflow-x-auto p-2 lg:flex-col">{tabs.map(([to, l]) => <NavLink key={to} to={to} end={!to} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand text-white' : 'hover:bg-gray-100'}`}>{l}</NavLink>)}</nav>
    <div><Routes><Route index element={<Overview />} /><Route path="profile" element={<Profile />} /><Route path="inquiries" element={<Inquiries />} /><Route path="imports" element={<Imports />} /><Route path="favorites" element={<Favorites />} /><Route path="quotations" element={<Quotations />} /><Route path="notifications" element={<Notifications />} /><Route path="settings" element={<Settings />} /></Routes></div>
  </div>;
}
