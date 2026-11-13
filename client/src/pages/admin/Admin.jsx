import { NavLink, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { GripVertical, ImagePlus, Play } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import logo from '../../assets/logo-dark.png';
import { api, get, errMsg } from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Spinner, ErrorState, Empty, Badge, Field, Pager } from '../../components/ui.jsx';
import { IMPORT_STATUSES, FUELS, TRANSMISSIONS, lkr, date } from '../../utils/format.js';

const nav = [['', 'Dashboard'], ['vehicles', 'Vehicles'], ['categories', 'Categories'], ['auctions', 'Auction Listings'], ['imports', 'Import Requests'], ['customers', 'Customers'], ['inquiries', 'Inquiries'], ['quotations', 'Quotations'], ['tax', 'Tax Configuration'], ['gallery', 'Media Gallery'], ['content', 'Website Content'], ['reports', 'Reports']];
const Load = ({ q, children }) => q.isLoading ? <Spinner /> : q.isError ? <ErrorState message={errMsg(q.error)} onRetry={q.refetch} /> : children(q.data);
const Title = ({ children, action }) => <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"><h1 className="text-2xl font-extrabold">{children}</h1>{action}</div>;
const Table = ({ cols, rows }) => <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-gray-50 text-xs uppercase text-gray-500"><tr>{cols.map((c) => <th key={c} className="px-3 py-2">{c}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i} className="border-b last:border-0">{r.map((c, j) => <td key={j} className="px-3 py-2 align-top">{c}</td>)}</tr>)}</tbody></table>{!rows.length && <Empty title="No records" />}</div>;

function Dashboard() {
  const q = useQuery({ queryKey: ['a-dash'], queryFn: () => get('/admin/dashboard').then((r) => r.data) });
  return <Load q={q}>{(d) => <><Title>Dashboard</Title>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">{[['Total vehicles', d.totalVehicles], ['Available', d.availableVehicles], ['Reserved', d.reservedVehicles], ['Sold', d.soldVehicles], ['Customers', d.totalCustomers], ['Pending inquiries', d.pendingInquiries], ['Active imports', d.activeImports], ['Completed imports', d.completedImports], ['Quotations', d.totalQuotations]].map(([k, v]) => <div key={k} className="card p-4"><p className="text-xs text-gray-500">{k}</p><p className="text-2xl font-extrabold">{v}</p></div>)}</div>
    <div className="card mt-6 p-4"><h3 className="mb-2 font-bold">Import requests by status</h3><div className="h-64"><ResponsiveContainer><BarChart data={d.importsByStatus}><XAxis dataKey="status" tick={{ fontSize: 10 }} interval={0} angle={-25} height={70} textAnchor="end" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#C99833" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div></>}</Load>;
}

const num = (v) => (v === '' || v == null ? undefined : Number(v));
const list = (v) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : []);
function Vehicles() {
  const qc = useQueryClient(); const [page, setPage] = useState(1); const [edit, setEdit] = useState(null);
  const q = useQuery({ queryKey: ['a-veh', page], queryFn: () => get('/vehicles', { page, limit: 15 }) });
  const cats = useQuery({ queryKey: ['cats'], queryFn: () => get('/categories', { limit: 100 }).then((r) => r.data) });
  const { register, handleSubmit, reset } = useForm();
  const open = (v) => { setEdit(v || {}); reset(v ? { ...v, safetyFeatures: v.safetyFeatures?.join(', '), comfortFeatures: v.comfortFeatures?.join(', '), technologyFeatures: v.technologyFeatures?.join(', ') } : { listingStatus: 'draft', availabilityStatus: 'available', condition: 'Used', importStatus: 'local' }); };
  const save = useMutation({
    mutationFn: async (b) => {
      const body = { ...b, manufacturingYear: num(b.manufacturingYear), registrationYear: num(b.registrationYear), engineCapacity: num(b.engineCapacity), mileage: num(b.mileage), sellingPrice: num(b.sellingPrice), purchasePrice: num(b.purchasePrice), safetyFeatures: list(b.safetyFeatures), comfortFeatures: list(b.comfortFeatures), technologyFeatures: list(b.technologyFeatures) };
      delete body._id; delete body.__v; delete body.createdAt; delete body.updatedAt; delete body.slug;
      if (b.newImages?.length) { const f = new FormData(); [...b.newImages].forEach((x) => f.append('images', x)); const up = await api.post('/uploads/vehicle-images', f); body.images = [...(edit.images || []), ...up.data.data]; }
      delete body.newImages;
      return edit._id ? api.put(`/vehicles/${edit._id}`, body) : api.post('/vehicles', body);
    }, onSuccess: () => { setEdit(null); qc.invalidateQueries({ queryKey: ['a-veh'] }); }, onError: (e) => alert(errMsg(e)),
  });
  const del = async (id) => { if (confirm('Delete this vehicle?')) { await api.delete(`/vehicles/${id}`); qc.invalidateQueries({ queryKey: ['a-veh'] }); } };
  if (edit) return <><Title action={<button className="btn-ghost" onClick={() => setEdit(null)}>Back</button>}>{edit._id ? 'Edit vehicle' : 'New vehicle'}</Title>
    <form onSubmit={handleSubmit((b) => save.mutate(b))} className="card grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {[['make', 'Make'], ['model', 'Model'], ['variant', 'Variant'], ['manufacturingYear', 'Manufacturing year', 'number'], ['registrationYear', 'Registration year', 'number'], ['bodyType', 'Body type'], ['engineCapacity', 'Engine cc', 'number'], ['mileage', 'Mileage km', 'number'], ['sellingPrice', 'Selling price (LKR)', 'number'], ['purchasePrice', 'Purchase price (LKR, private)', 'number'], ['exteriorColor', 'Exterior colour'], ['countryOfOrigin', 'Country of origin'], ['auctionGrade', 'Auction grade'], ['auctionHouse', 'Auction house'], ['title', 'Listing title (auto if blank)']].map(([k, l, t]) => <Field key={k} label={l}><input type={t || 'text'} className="input" {...register(k)} /></Field>)}
      <Field label="Category"><select className="input" {...register('vehicleCategory')}><option value="">—</option>{cats.data?.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></Field>
      <Field label="Fuel"><select className="input" {...register('fuelType')}><option value="">—</option>{FUELS.map((f) => <option key={f}>{f}</option>)}</select></Field>
      <Field label="Transmission"><select className="input" {...register('transmission')}><option value="">—</option>{TRANSMISSIONS.map((f) => <option key={f}>{f}</option>)}</select></Field>
      <Field label="Condition"><select className="input" {...register('condition')}><option>New</option><option>Used</option><option>Reconditioned</option></select></Field>
      <Field label="Import status"><select className="input" {...register('importStatus')}><option value="local">Local</option><option value="imported">Imported</option><option value="import-available">Available to import</option></select></Field>
      <Field label="Availability"><select className="input" {...register('availabilityStatus')}><option>available</option><option>reserved</option><option>sold</option></select></Field>
      <Field label="Listing status"><select className="input" {...register('listingStatus')}><option>draft</option><option>published</option><option>archived</option></select></Field>
      <label className="flex items-center gap-2 pt-6 text-sm"><input type="checkbox" {...register('featured')} />Featured</label>
      <div className="sm:col-span-2 lg:col-span-3"><Field label="Description"><textarea rows={4} className="input" {...register('description')} /></Field></div>
      {['safetyFeatures', 'comfortFeatures', 'technologyFeatures'].map((k) => <Field key={k} label={`${k.replace('Features', '')} features (comma separated)`}><input className="input" {...register(k)} /></Field>)}
      <div className="sm:col-span-2 lg:col-span-3"><Field label="Add images (JPG/PNG/WebP, max 8MB each)"><input type="file" multiple accept="image/*" {...register('newImages')} /></Field>{edit.images?.length > 0 && <p className="mt-1 text-xs text-gray-500">{edit.images.length} existing image(s) kept.</p>}</div>
      <button className="btn-gold sm:col-span-2 lg:col-span-3" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save vehicle'}</button></form></>;
  return <><Title action={<button className="btn-gold" onClick={() => open()}>+ New vehicle</button>}>Vehicles</Title>
    <Load q={q}>{(d) => <><Table cols={['Vehicle', 'Price', 'Availability', 'Listing', '']} rows={d.data.map((v) => [<><b>{v.title}</b><br /><span className="text-xs text-gray-500">{v.vehicleCategory} {v.featured && '· featured'}</span></>, lkr(v.sellingPrice), v.availabilityStatus, v.listingStatus, <span className="flex gap-3"><button className="text-gold" onClick={() => open(v)}>Edit</button><button className="text-red-600" onClick={() => del(v._id)}>Delete</button></span>])} /><Pager meta={d.meta} onPage={setPage} /></>}</Load></>;
}

function Simple({ title, url, fields, cols, row }) {
  const qc = useQueryClient(); const q = useQuery({ queryKey: ['s', url], queryFn: () => get(`${url}/all`).then((r) => r.data).catch(() => get(url, { limit: 100 }).then((r) => r.data)) });
  const { register, handleSubmit, reset } = useForm();
  const add = useMutation({ mutationFn: (b) => api.post(url, Object.fromEntries(Object.entries(b).filter(([, v]) => v !== ''))), onSuccess: () => { reset(); qc.invalidateQueries({ queryKey: ['s', url] }); }, onError: (e) => alert(errMsg(e)) });
  const del = async (id) => { if (confirm('Delete?')) { await api.delete(`${url}/${id}`); qc.invalidateQueries({ queryKey: ['s', url] }); } };
  return <><Title>{title}</Title>
    <form onSubmit={handleSubmit((b) => add.mutate(b))} className="card mb-4 grid gap-3 p-4 sm:grid-cols-3">{fields.map(([k, l, t]) => <Field key={k} label={l}>{t === 'area' ? <textarea className="input" {...register(k)} /> : <input type={t || 'text'} className="input" {...register(k)} />}</Field>)}<button className="btn-gold self-end">Add</button></form>
    <Load q={q}>{(d) => <Table cols={[...cols, '']} rows={d.map((x) => [...row(x), <button className="text-red-600" onClick={() => del(x._id)}>Delete</button>])} />}</Load></>;
}

function Imports() {
  const qc = useQueryClient(); const [status, setStatus] = useState('');
  const q = useQuery({ queryKey: ['a-imp', status], queryFn: () => get('/import-requests', { status, limit: 50 }) });
  const staff = useQuery({ queryKey: ['staff'], queryFn: () => get('/admin/staff').then((r) => r.data).catch(() => []) });
  const upd = async (id, status) => { const note = prompt('Optional note for the customer:') ?? ''; try { await api.patch(`/import-requests/${id}/status`, { status, note: note || undefined }); qc.invalidateQueries({ queryKey: ['a-imp'] }); } catch (e) { alert(errMsg(e)); } };
  const assign = async (id, v) => { try { await api.put(`/import-requests/${id}`, { assignedStaff: v || null }); qc.invalidateQueries({ queryKey: ['a-imp'] }); } catch (e) { alert(errMsg(e)); } };
  return <><Title action={<select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{IMPORT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>}>Import Requests</Title>
    <Load q={q}>{(d) => <Table cols={['Request', 'Customer', 'Vehicle', 'Budget', 'Status', 'Assigned']} rows={d.data.map((r) => [<><b>{r.requestNo}</b><br /><span className="text-xs text-gray-500">{date(r.createdAt)}</span></>, <>{r.customer?.name}<br /><span className="text-xs text-gray-500">{r.customer?.phone || r.customer?.email}</span></>, `${r.preferredVehicle?.make} ${r.preferredVehicle?.model} ${r.preferredVehicle?.manufacturingYear || ''}`, lkr(r.budget),
      <select className="input" value={r.status} onChange={(e) => upd(r._id, e.target.value)}>{IMPORT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>,
      <select className="input" value={r.assignedStaff?._id || ''} onChange={(e) => assign(r._id, e.target.value)}><option value="">Unassigned</option>{staff.data?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select>])} />}</Load></>;
}
function Customers() {
  const [qs, setQs] = useState(''); const q = useQuery({ queryKey: ['a-cust', qs], queryFn: () => get('/admin/customers', { q: qs, limit: 50 }) });
  return <><Title action={<input className="input w-56" placeholder="Search…" onChange={(e) => setQs(e.target.value)} />}>Customers</Title><Load q={q}>{(d) => <Table cols={['Name', 'Email', 'Phone', 'Verified', 'Joined']} rows={d.data.map((c) => [c.name, c.email, c.phone || '—', c.emailVerified ? 'Yes' : 'No', date(c.createdAt)])} />}</Load></>;
}
function Inquiries() {
  const qc = useQueryClient(); const q = useQuery({ queryKey: ['a-inq'], queryFn: () => get('/inquiries', { limit: 50 }) });
  const upd = async (id, status) => { await api.put(`/inquiries/${id}`, { status }); qc.invalidateQueries({ queryKey: ['a-inq'] }); };
  return <><Title>Inquiries</Title><Load q={q}>{(d) => <Table cols={['From', 'About', 'Message', 'Status']} rows={d.data.map((i) => [<>{i.name}<br /><span className="text-xs text-gray-500">{i.email} {i.phone}</span></>, <>{i.vehicle?.title || 'General'}<br /><Badge>{i.inquiryType}</Badge></>, <span className="line-clamp-3 max-w-md">{i.message}</span>, <select className="input" value={i.status} onChange={(e) => upd(i._id, e.target.value)}>{['new', 'in-progress', 'resolved', 'closed'].map((s) => <option key={s}>{s}</option>)}</select>])} />}</Load></>;
}
function Quotations() {
  const qc = useQueryClient(); const q = useQuery({ queryKey: ['a-quo'], queryFn: () => get('/quotations', { limit: 50 }) });
  const cust = useQuery({ queryKey: ['a-cust-all'], queryFn: () => get('/admin/customers', { limit: 100 }).then((r) => r.data) });
  const { register, handleSubmit, reset } = useForm();
  const add = useMutation({ mutationFn: (b) => api.post('/quotations', Object.fromEntries(Object.entries(b).filter(([, v]) => v !== ''))), onSuccess: () => { reset(); qc.invalidateQueries({ queryKey: ['a-quo'] }); }, onError: (e) => alert(errMsg(e)) });
  const send = async (id) => { try { await api.patch(`/quotations/${id}/status`, { status: 'sent' }); qc.invalidateQueries({ queryKey: ['a-quo'] }); } catch (e) { alert(errMsg(e)); } };
  return <><Title>Quotations</Title>
    <form onSubmit={handleSubmit((b) => add.mutate(b))} className="card mb-4 grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
      <Field label="Customer"><select className="input" required {...register('customer')}><option value="">Select…</option>{cust.data?.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.email})</option>)}</select></Field>
      <Field label="Vehicle price"><input type="number" required className="input" {...register('vehiclePrice')} /></Field><Field label="Shipping"><input type="number" className="input" {...register('shippingCost')} /></Field><Field label="Taxes"><input type="number" className="input" {...register('taxes')} /></Field>
      <Field label="Other charges"><input type="number" className="input" {...register('otherCharges')} /></Field><Field label="Valid (days)"><input type="number" className="input" {...register('validityPeriod')} /></Field><Field label="Import request ID (optional)"><input className="input" {...register('importRequest')} /></Field><button className="btn-gold self-end">Create draft</button></form>
    <Load q={q}>{(d) => <Table cols={['No.', 'Customer', 'Total', 'Status', '']} rows={d.data.map((x) => [x.quoteNo, x.customer?.name, lkr(x.totalPrice), x.status, x.status === 'draft' ? <button className="text-gold" onClick={() => send(x._id)}>Send to customer</button> : ''])} />}</Load></>;
}

function Gallery() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['a-gallery'], queryFn: () => get('/gallery/all').then((r) => r.data) });
  const [files, setFiles] = useState([]);
  const [items, setItems] = useState([]);
  const [dragged, setDragged] = useState(null);
  const upload = useMutation({
    mutationFn: async () => {
      if (!files.length) throw new Error('Choose at least one image or video');
      const form = new FormData();
      files.forEach((file) => form.append('media', file));
      return api.post('/uploads/gallery-media', form);
    },
    onSuccess: () => { setFiles([]); qc.invalidateQueries({ queryKey: ['a-gallery'] }); },
    onError: (e) => alert(errMsg(e)),
  });
  const reorder = async (from, to) => {
    const next = [...(items.length ? items : q.data)];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    try { await Promise.all(next.map((item, index) => api.put(`/gallery/${item._id}`, { order: index }))); qc.invalidateQueries({ queryKey: ['a-gallery'] }); }
    catch (e) { alert(errMsg(e)); setItems([]); }
  };
  const update = async (item, data) => {
    try { await api.put(`/gallery/${item._id}`, data); qc.invalidateQueries({ queryKey: ['a-gallery'] }); }
    catch (e) { alert(errMsg(e)); }
  };
  const remove = async (id) => {
    if (confirm('Delete this gallery item?')) { try { await api.delete(`/gallery/${id}`); qc.invalidateQueries({ queryKey: ['a-gallery'] }); } catch (e) { alert(errMsg(e)); } }
  };
  const rows = items.length ? items : q.data || [];
  return <><Title>Media Gallery</Title>
    <form onSubmit={(e) => { e.preventDefault(); upload.mutate(); }} className="card mb-6 border-2 border-dashed p-6 text-center" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFiles((current) => [...current, ...e.dataTransfer.files].filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))); }}>
      <ImagePlus className="mx-auto text-gold" size={30} /><p className="mt-2 font-semibold">Drop images and videos here</p><p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP, MP4, WebM or MOV · 50MB max per file</p>
      <input className="mx-auto mt-4 block max-w-full text-sm" type="file" accept="image/*,video/*" multiple onChange={(e) => setFiles([...e.target.files])} />
      {files.length > 0 && <p className="mt-3 text-sm text-gray-600">{files.length} file(s) ready to upload</p>}
      <button className="btn-gold mt-4" disabled={upload.isPending}>{upload.isPending ? 'Uploading…' : 'Upload media'}</button>
    </form>
    <Load q={q}>{() => <div className="space-y-3">{rows.map((item, index) => <div key={item._id} draggable onDragStart={() => setDragged(index)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragged !== null && dragged !== index) reorder(dragged, index); setDragged(null); }} className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
      <GripVertical className="hidden shrink-0 cursor-grab text-gray-400 sm:block" size={20} />
      <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:w-40">{item.type === 'video' ? <video src={item.url} muted controls className="h-full w-full object-cover" /> : <img src={item.url} alt="" className="h-full w-full object-cover" />}</div>
      <div className="flex-1"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">{item.type}{item.type === 'video' && <Play className="ml-1 inline" size={11} />}</p><input className="input mt-2" defaultValue={item.caption} placeholder="Optional caption" onBlur={(e) => e.target.value !== item.caption && update(item, { caption: e.target.value })} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked={item.published} onChange={(e) => update(item, { published: e.target.checked })} /> Published</label>
      <button type="button" className="text-sm text-red-600" onClick={() => remove(item._id)}>Delete</button>
    </div>)}</div>}</Load>
  </>;
}
function Tax() {
  const qc = useQueryClient(); const q = useQuery({ queryKey: ['a-tax'], queryFn: () => get('/tax-configurations').then((r) => r.data) });
  const { register, control, handleSubmit, reset } = useForm({ defaultValues: { vehicleCategory: 'any', fuelType: 'any', min: 0, max: 100000, rules: [{ name: '', type: 'percent', base: 'cif', value: '' }] } });
  const { fields, append, remove } = useFieldArray({ control, name: 'rules' });
  const add = useMutation({ mutationFn: (b) => api.post('/tax-configurations', { name: b.name, vehicleCategory: b.vehicleCategory || 'any', fuelType: b.fuelType || 'any', engineCapacityRange: { min: +b.min, max: +b.max }, effectiveFrom: b.effectiveFrom, effectiveTo: b.effectiveTo || null, notes: b.notes, taxRules: b.rules.map((r) => ({ ...r, value: +r.value })) }), onSuccess: () => { reset(); qc.invalidateQueries({ queryKey: ['a-tax'] }); }, onError: (e) => alert(errMsg(e)) });
  const off = async (id) => { await api.delete(`/tax-configurations/${id}`); qc.invalidateQueries({ queryKey: ['a-tax'] }); };
  return <><Title>Tax Configuration</Title>
    <p className="mb-3 rounded-lg bg-gold-100 p-3 text-sm">Enter rates exactly as published by the relevant authority. No rates are built in. The calculator will refuse to estimate until a matching active configuration exists. Rules run in order; “running” bases include earlier rules.</p>
    <form onSubmit={handleSubmit((b) => add.mutate(b))} className="card mb-4 space-y-3 p-4">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6"><Field label="Name"><input required className="input" {...register('name')} /></Field><Field label="Category slug (or any)"><input className="input" {...register('vehicleCategory')} /></Field><Field label="Fuel (or any)"><input className="input" {...register('fuelType')} /></Field><Field label="Min cc"><input type="number" className="input" {...register('min')} /></Field><Field label="Max cc"><input type="number" className="input" {...register('max')} /></Field><Field label="Effective from"><input type="date" required className="input" {...register('effectiveFrom')} /></Field></div>
      {fields.map((f, i) => <div key={f.id} className="grid gap-2 sm:grid-cols-5"><input placeholder="Rule name" required className="input" {...register(`rules.${i}.name`)} /><select className="input" {...register(`rules.${i}.type`)}><option value="percent">Percent</option><option value="fixed">Fixed LKR</option><option value="per_cc">Per cc</option></select><select className="input" {...register(`rules.${i}.base`)}><option value="cif">Base: CIF</option><option value="running">Base: running total</option></select><input type="number" step="any" required placeholder="Value" className="input" {...register(`rules.${i}.value`)} /><button type="button" className="text-red-600" onClick={() => remove(i)}>Remove</button></div>)}
      <div className="flex gap-2"><button type="button" className="btn-ghost" onClick={() => append({ name: '', type: 'percent', base: 'cif', value: '' })}>+ Rule</button><button className="btn-gold">Save configuration</button></div></form>
    <Load q={q}>{(d) => <Table cols={['Name', 'Applies to', 'Effective', 'Rules', 'Active', 'History', '']} rows={d.map((c) => [c.name, `${c.vehicleCategory} / ${c.fuelType} / ${c.engineCapacityRange.min}-${c.engineCapacityRange.max}cc`, `${date(c.effectiveFrom)}${c.effectiveTo ? ' → ' + date(c.effectiveTo) : ''}`, c.taxRules.map((r) => `${r.name}: ${r.value}${r.type === 'percent' ? '%' : r.type === 'per_cc' ? '/cc' : ''}`).join('; '), c.isActive ? 'Yes' : 'No', `${c.history?.length || 0} entries`, c.isActive && <button className="text-red-600" onClick={() => off(c._id)}>Deactivate</button>])} />}</Load></>;
}
function Content() {
  const qc = useQueryClient(); const q = useQuery({ queryKey: ['settings'], queryFn: () => get('/settings').then((r) => r.data) }); const [m, setM] = useState('');
  const { register, handleSubmit } = useForm({ values: q.data });
  return <><Title>Website Content</Title>
    <form onSubmit={handleSubmit(async (b) => { try { await api.put('/settings', { heroTitle: b.heroTitle, heroSubtitle: b.heroSubtitle, phone: b.phone, whatsapp: b.whatsapp, email: b.email, address: b.address }); qc.invalidateQueries({ queryKey: ['settings'] }); setM('Saved'); } catch (e) { setM(errMsg(e)); } })} className="card mb-6 grid gap-3 p-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><Field label="Hero headline"><input className="input" {...register('heroTitle')} /></Field></div><div className="sm:col-span-2"><Field label="Hero supporting text"><textarea rows={2} className="input" {...register('heroSubtitle')} /></Field></div>
      <Field label="Phone"><input className="input" {...register('phone')} /></Field><Field label="WhatsApp number (with country code)"><input className="input" {...register('whatsapp')} /></Field><Field label="Email"><input className="input" {...register('email')} /></Field><Field label="Address"><input className="input" {...register('address')} /></Field>
      {m && <p className="text-sm sm:col-span-2">{m}</p>}<button className="btn-gold sm:col-span-2">Save</button></form>
    <Simple title="FAQ" url="/faqs" fields={[['question', 'Question'], ['answer', 'Answer', 'area'], ['order', 'Order', 'number']]} cols={['Question', 'Answer']} row={(x) => [x.question, <span className="line-clamp-2">{x.answer}</span>]} />
    <div className="mt-8"><Simple title="Testimonials" url="/testimonials" fields={[['name', 'Name'], ['location', 'Location'], ['quote', 'Quote', 'area'], ['rating', 'Rating 1-5', 'number']]} cols={['Name', 'Quote']} row={(x) => [x.name, x.quote]} /></div></>;
}
function Reports() {
  const dl = async (type) => { const r = await api.get('/admin/reports', { params: { type, format: 'csv' }, responseType: 'blob' }); const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = `${type}-report.csv`; a.click(); };
  return <><Title>Reports</Title><div className="grid gap-4 sm:grid-cols-3">{['imports', 'inquiries', 'quotations'].map((t) => <div key={t} className="card p-5"><h3 className="font-bold capitalize">{t}</h3><button className="btn-dark mt-3" onClick={() => dl(t).catch((e) => alert(errMsg(e)))}>Export CSV</button></div>)}</div></>;
}

export default function Admin() {
  const { user, logout } = useAuth(); const go = useNavigate();
  return <div className="flex min-h-screen min-w-0 bg-gray-50">
    <aside className="hidden w-60 shrink-0 bg-brand p-4 text-gray-300 lg:block"><Link to="/"><img src={logo} alt="Cars@855" className="mb-6 h-12" /></Link>
      {nav.map(([to, l]) => <NavLink key={to} to={to} end={!to} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-gold text-white' : 'hover:bg-white/10'}`}>{l}</NavLink>)}</aside>
    <div className="min-w-0 flex-1">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3"><select className="input min-w-0 flex-1 lg:hidden" onChange={(e) => go(e.target.value ? `/admin/${e.target.value}` : '/admin')}>{nav.map(([to, l]) => <option key={to} value={to}>{l}</option>)}</select><span className="ml-auto truncate text-right text-sm">{user.name} · {user.role}</span><button className="shrink-0 text-sm text-gold" onClick={async () => { await logout(); go('/'); }}>Logout</button></header>
      <div className="p-4 sm:p-6"><Routes>
        <Route index element={<Dashboard />} /><Route path="vehicles" element={<Vehicles />} />
        <Route path="categories" element={<Simple title="Vehicle Categories" url="/categories" fields={[['name', 'Name'], ['description', 'Description']]} cols={['Name', 'Slug']} row={(c) => [c.name, c.slug]} />} />
        <Route path="auctions" element={<Simple title="Auction Listings" url="/auctions" fields={[['make', 'Make'], ['model', 'Model'], ['manufacturingYear', 'Year', 'number'], ['auctionGrade', 'Grade'], ['mileage', 'Mileage', 'number'], ['engineCapacity', 'Engine cc', 'number'], ['auctionHouse', 'Auction house'], ['auctionDate', 'Auction date', 'date'], ['startingBid', 'Starting bid', 'number'], ['currency', 'Currency (JPY)'], ['estimatedLandedCost', 'Est. landed cost (LKR)', 'number']]} cols={['Vehicle', 'Grade', 'Auction', 'Bid']} row={(a) => [`${a.make} ${a.model} ${a.manufacturingYear || ''}`, a.auctionGrade, `${a.auctionHouse || ''} ${date(a.auctionDate)}`, `${a.currency} ${a.startingBid ?? ''}`]} />} />
        <Route path="imports" element={<Imports />} /><Route path="customers" element={<Customers />} /><Route path="inquiries" element={<Inquiries />} /><Route path="quotations" element={<Quotations />} /><Route path="tax" element={<Tax />} /><Route path="gallery" element={<Gallery />} /><Route path="content" element={<Content />} /><Route path="reports" element={<Reports />} />
      </Routes></div></div></div>;
}
