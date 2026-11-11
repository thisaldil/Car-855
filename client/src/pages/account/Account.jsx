import { NavLink, Routes, Route, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { forwardRef, useState } from 'react';
import {
  Bell, Check, Clock, Eye, EyeOff, FileText, Heart, LayoutDashboard, Loader2, MailWarning,
  MessageSquare, Plus, Settings as SettingsIcon, Ship, Trash2, Upload, User as UserIcon,
} from 'lucide-react';
import { api, get, errMsg } from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTitle } from '../../hooks/useSettings.js';
import {
  Spinner, SkeletonList, Empty, ErrorState, Badge, Field, Pager, StatCard, ConfirmDialog, Toaster, toast, statusTone,
} from '../../components/ui.jsx';
import VehicleCard from '../../components/VehicleCard.jsx';
import { IMPORT_STATUSES, date, lkr } from '../../utils/format.js';

/* ───────────── Config & helpers ───────────── */

const MAX_UPLOAD_MB = 10;
const DAY = 864e5;

const tabs = [
  ['', 'Overview', LayoutDashboard],
  ['profile', 'Profile', UserIcon],
  ['inquiries', 'Inquiries', MessageSquare],
  ['imports', 'Import requests', Ship],
  ['favorites', 'Favorites', Heart],
  ['quotations', 'Quotations', FileText],
  ['notifications', 'Notifications', Bell],
  ['settings', 'Settings', SettingsIcon],
];

// react-query v4 exposes isLoading for mutations, v5 exposes isPending
const busy = (m) => m.isPending ?? m.isLoading;

const useList = (key, url, page = 1, limit = 10) => useQuery({
  queryKey: [key, page, limit],
  queryFn: () => get(url, { page, limit }),
  placeholderData: (prev) => prev, // keeps the previous page on screen while the next one loads
});

const useUnread = () => {
  const q = useList('notes', '/notifications', 1, 50);
  return q.data?.data?.filter((n) => !n.read).length ?? 0;
};

const Wrap = ({ q, children }) => {
  if (q.isLoading) return <SkeletonList />;
  if (q.isError) return <ErrorState message={errMsg(q.error)} onRetry={q.refetch} />;
  return children(q.data?.data ?? [], q.data?.meta);
};

const Section = ({ title, desc, action, children }) => (
  <section>
    <div className="mb-5 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="break-words text-xl font-bold sm:text-2xl">{title}</h2>
        {desc && <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500">{desc}</p>}
      </div>
      {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
    </div>
    {children}
  </section>
);

const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'U';

/* ───────────── Import progress tracker ───────────── */

export function Tracker({ status, history = [] }) {
  const steps = IMPORT_STATUSES.filter((s) => s !== 'Cancelled');
  if (status === 'Cancelled') return <Badge tone="red" dot>Cancelled</Badge>;
  const idx = steps.indexOf(status);

  return (
    <ol aria-label="Import progress" className="mt-4 flex flex-col lg:flex-row">
      {steps.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        const h = history.find((x) => x.status === s);
        return (
          <li key={s} aria-current={current ? 'step' : undefined} className="relative flex min-w-0 flex-1 gap-3 pb-5 last:pb-0 lg:flex-col lg:gap-2 lg:pb-0 lg:pr-2">
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={`absolute left-[13px] top-7 h-full w-0.5 lg:left-7 lg:top-[13px] lg:h-0.5 lg:w-[calc(100%-1.75rem)] ${done ? 'bg-green-500' : 'bg-gray-200'}`}
              />
            )}
            <span
              className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                done ? 'bg-green-500 text-white' : current ? 'bg-gold text-white ring-4 ring-gold-100' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {done ? <Check size={14} aria-hidden /> : i + 1}
            </span>
            <span className="min-w-0">
            <span className={`block break-words text-xs leading-tight ${current ? 'font-bold text-gray-900' : done ? 'font-medium text-gray-700' : 'text-gray-400'}`}>{s}</span>
              {h?.at && <span className="mt-0.5 block text-[11px] text-gray-500">{date(h.at)}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ───────────── Overview ───────────── */

function Overview() {
  const { user } = useAuth();
  const imports = useList('my-imports', '/import-requests', 1, 5);
  const inquiries = useList('my-inquiries', '/inquiries', 1, 1);
  const quotes = useList('my-quotes', '/quotations', 1, 1);
  const unread = useUnread();
  const latest = imports.data?.data?.[0];

  return (
    <Section title={`Hello, ${user.name?.split(' ')[0] || 'there'}`} desc="Here is where everything stands.">
      {!user.emailVerified && (
        <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-gold bg-gold-100 p-4 text-sm">
          <MailWarning size={18} className="mt-0.5 shrink-0 text-gold-600" aria-hidden />
          <p className="min-w-0 break-words">Verify your email to receive quotations and import updates. Use the link we sent to <b>{user.email}</b>.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Ship} label="Import requests" value={imports.data?.meta?.total} to="imports" />
        <StatCard icon={FileText} label="Quotations" value={quotes.data?.meta?.total} to="quotations" />
        <StatCard icon={MessageSquare} label="Inquiries" value={inquiries.data?.meta?.total} to="inquiries" />
        <StatCard icon={Bell} label="Unread notifications" value={unread} to="notifications" />
      </div>

      <div className="card mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold">Latest import</h3>
          <Link to="/import" className="btn-gold inline-flex items-center gap-1.5 text-sm"><Plus size={14} aria-hidden /> New import request</Link>
        </div>
        {imports.isLoading ? <Spinner /> : latest ? (
          <>
            <p className="mt-3 text-sm text-gray-600">
              {latest.requestNo} · {latest.preferredVehicle?.make} {latest.preferredVehicle?.model} {latest.preferredVehicle?.manufacturingYear}
            </p>
            <Tracker status={latest.status} history={latest.progressHistory} />
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-500">You have not requested an import yet. Tell us the vehicle you want and we will source it.</p>
        )}
      </div>
    </Section>
  );
}

/* ───────────── Import requests ───────────── */

function Imports() {
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const q = useList('my-imports', '/import-requests', page);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['my-imports'] });

  const cancel = useMutation({
    mutationFn: (id) => api.patch(`/import-requests/${id}/cancel`),
    onSuccess: () => { toast('Import request cancelled'); setCancelId(null); refresh(); },
    onError: (e) => { toast.error(errMsg(e)); setCancelId(null); },
  });

  const upload = useMutation({
    mutationFn: ({ id, file }) => {
      const f = new FormData();
      f.append('file', file);
      return api.post(`/uploads/import-documents/${id}`, f);
    },
    onMutate: ({ id }) => setUploadingId(id),
    onSuccess: () => { toast('Document uploaded'); refresh(); },
    onError: (e) => toast.error(errMsg(e)),
    onSettled: () => setUploadingId(null),
  });

  const onFile = (id, e) => {
    const file = e.target.files[0];
    e.target.value = ''; // lets the same file be chosen again after an error
    if (!file) return;
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return toast.error(`File is too large. The limit is ${MAX_UPLOAD_MB} MB.`);
    upload.mutate({ id, file });
  };

  return (
    <Section title="Import requests" desc="Track each vehicle from approval to delivery.">
      <Wrap q={q}>
        {(items, meta) => !items.length
          ? <Empty title="No import requests yet" hint="Submit a request and track its progress here." action={{ to: '/import', label: 'Start an import request' }} />
          : (
            <>
              <div className="space-y-4">
                {items.map((r) => {
                  const cancellable = r.status !== 'Cancelled' && IMPORT_STATUSES.indexOf(r.status) < IMPORT_STATUSES.indexOf('Vehicle Purchased');
                  const uploading = uploadingId === r._id;
                  return (
                    <article key={r._id} className="card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="break-words text-xs text-gray-500">{r.requestNo} · Requested {date(r.createdAt)}</p>
                          <h3 className="mt-0.5 break-words font-bold">{r.preferredVehicle?.make} {r.preferredVehicle?.model} {r.preferredVehicle?.manufacturingYear}</h3>
                        </div>
                        <Badge tone={statusTone(r.status)} dot>{r.status}</Badge>
                      </div>

                      <Tracker status={r.status} history={r.progressHistory} />

                      {r.status !== 'Cancelled' && (
                        <div className="mt-5 flex flex-col items-stretch gap-3 border-t border-gray-100 pt-4 text-sm sm:flex-row sm:flex-wrap sm:items-center">
                          <label className={`btn-ghost inline-flex w-full cursor-pointer items-center gap-2 sm:w-auto ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
                            {uploading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Upload size={14} aria-hidden />}
                            {uploading ? 'Uploading…' : 'Upload document'}
                            <input type="file" hidden disabled={uploading} accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => onFile(r._id, e)} />
                          </label>
                          <span className="text-xs text-gray-400">PDF or image, up to {MAX_UPLOAD_MB} MB</span>
                          {cancellable && (
                            <button className="text-left font-medium text-red-600 hover:underline sm:ml-auto" onClick={() => setCancelId(r._id)}>Cancel request</button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
              <Pager meta={meta} onPage={setPage} />
            </>
          )}
      </Wrap>

      <ConfirmDialog
        open={!!cancelId}
        title="Cancel this import request?"
        message="We will stop work on this vehicle. You can submit a new request at any time."
        confirmLabel="Cancel request"
        loading={busy(cancel)}
        onConfirm={() => cancel.mutate(cancelId)}
        onClose={() => setCancelId(null)}
      />
    </Section>
  );
}

/* ───────────── Inquiries ───────────── */

function Inquiries() {
  const [page, setPage] = useState(1);
  const q = useList('my-inquiries', '/inquiries', page);
  return (
    <Section title="Inquiries" desc="Questions you have sent about vehicles.">
      <Wrap q={q}>
        {(items, meta) => !items.length
          ? <Empty icon={MessageSquare} title="No inquiries yet" hint="Ask about any vehicle and our team will reply here." />
          : (
            <>
              <div className="space-y-3">
                {items.map((i) => (
                  <article key={i._id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 break-words font-semibold">{i.vehicle?.title || 'General inquiry'}</h3>
                      <Badge tone={statusTone(i.status)} dot>{i.status}</Badge>
                    </div>
                    <p className="mt-1.5 line-clamp-3 text-sm text-gray-600">{i.message}</p>
                    <p className="mt-2 text-xs text-gray-400">{date(i.createdAt)}</p>
                  </article>
                ))}
              </div>
              <Pager meta={meta} onPage={setPage} />
            </>
          )}
      </Wrap>
    </Section>
  );
}

/* ───────────── Favorites ───────────── */

function Favorites() {
  const q = useQuery({ queryKey: ['favs'], queryFn: () => get('/favorites') });
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: (vehicleId) => api.delete(`/favorites/${vehicleId}`),
    onSuccess: () => { toast('Removed from favorites'); qc.invalidateQueries({ queryKey: ['favs'] }); },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <Section title="Favorites" desc="Vehicles you have saved.">
      <Wrap q={q}>
        {(items) => {
          const list = items.filter((f) => f.vehicle); // skip vehicles that were deleted
          return !list.length
            ? <Empty icon={Heart} title="No favorites yet" hint="Tap the heart on a vehicle to save it here." action={{ to: '/vehicles', label: 'Browse vehicles' }} />
            : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((f) => (
                  <div key={f._id}>
                    <VehicleCard v={f.vehicle} />
                    <button
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                      disabled={busy(remove)}
                      onClick={() => remove.mutate(f.vehicle._id)}
                    >
                      <Trash2 size={12} aria-hidden /> Remove
                    </button>
                  </div>
                ))}
              </div>
            );
        }}
      </Wrap>
    </Section>
  );
}

/* ───────────── Quotations ───────────── */

const expiry = (x) => {
  const left = Math.ceil((new Date(x.createdAt).getTime() + (x.validityPeriod || 0) * DAY - Date.now()) / DAY);
  return { left, expired: left < 0 };
};

function Quotations() {
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState(null); // { id, status }
  const q = useList('my-quotes', '/quotations', page);
  const qc = useQueryClient();

  const act = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/quotations/${id}/status`, { status }),
    onSuccess: (_, { status }) => { toast(status === 'accepted' ? 'Quotation accepted' : 'Quotation declined'); setDecision(null); qc.invalidateQueries({ queryKey: ['my-quotes'] }); },
    onError: (e) => { toast.error(errMsg(e)); setDecision(null); },
  });

  const accepting = decision?.status === 'accepted';

  return (
    <Section title="Quotations" desc="Review and respond to price quotes from our team.">
      <Wrap q={q}>
        {(items, meta) => !items.length
          ? <Empty icon={FileText} title="No quotations yet" hint="Quotes appear here once we have priced your request." />
          : (
            <>
              <div className="space-y-3">
                {items.map((x) => {
                  const { left, expired } = expiry(x);
                  const open = x.status === 'sent' && !expired;
                  const lines = [['Vehicle', x.vehiclePrice], ['Shipping', x.shippingCost], ['Taxes', x.taxes], ['Other charges', x.otherCharges]];
                  return (
                    <article key={x._id} className="card p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="break-words font-bold">{x.quoteNo}</h3>
                          <p className="break-words text-sm text-gray-500">{x.vehicle?.title}</p>
                        </div>
                        <Badge tone={x.status === 'sent' && expired ? 'red' : statusTone(x.status)} dot>
                          {x.status === 'sent' && expired ? 'expired' : x.status}
                        </Badge>
                      </div>

                      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                        {lines.map(([k, v]) => (
                          <div key={k}><dt className="text-xs text-gray-500">{k}</dt><dd className="font-medium tabular-nums">{lkr(v)}</dd></div>
                        ))}
                      </dl>

                      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-gray-100 pt-4">
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-2xl font-extrabold tabular-nums">{lkr(x.totalPrice)}</p>
                          {x.status === 'sent' && (
                            <p className={`mt-0.5 flex items-center gap-1 text-xs ${expired || left <= 3 ? 'text-red-600' : 'text-gray-500'}`}>
                              <Clock size={12} aria-hidden />
                              {expired ? `Expired ${date(new Date(new Date(x.createdAt).getTime() + x.validityPeriod * DAY))}` : left === 0 ? 'Expires today' : `Valid for ${left} more day${left === 1 ? '' : 's'}`}
                            </p>
                          )}
                        </div>
                        {open && (
                          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <button className="btn-ghost w-full sm:w-auto" onClick={() => setDecision({ id: x._id, status: 'rejected' })}>Decline</button>
                            <button className="btn-gold w-full sm:w-auto" onClick={() => setDecision({ id: x._id, status: 'accepted' })}>Accept quotation</button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
              <Pager meta={meta} onPage={setPage} />
            </>
          )}
      </Wrap>

      <ConfirmDialog
        open={!!decision}
        tone={accepting ? 'gold' : 'danger'}
        title={accepting ? 'Accept this quotation?' : 'Decline this quotation?'}
        message={accepting ? 'Our team will be notified and will contact you about the next steps.' : 'You will not be able to accept this quotation afterwards.'}
        confirmLabel={accepting ? 'Accept' : 'Decline'}
        cancelLabel="Go back"
        loading={busy(act)}
        onConfirm={() => act.mutate(decision)}
        onClose={() => setDecision(null)}
      />
    </Section>
  );
}

/* ───────────── Notifications ───────────── */

function Notifications() {
  const [page, setPage] = useState(1);
  const q = useList('notes', '/notifications', page);
  const qc = useQueryClient();
  const readAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
    onError: (e) => toast.error(errMsg(e)),
  });
  const hasUnread = q.data?.data?.some((n) => !n.read);

  return (
    <Section
      title="Notifications"
      desc="Updates on your requests, quotes and inquiries."
      action={<button className="text-left text-sm font-medium text-gold hover:underline disabled:cursor-not-allowed disabled:opacity-40 sm:text-right" disabled={!hasUnread || busy(readAll)} onClick={() => readAll.mutate()}>Mark all as read</button>}
    >
      <Wrap q={q}>
        {(items, meta) => !items.length
          ? <Empty icon={Bell} title="No notifications" hint="We will let you know when something changes." />
          : (
            <>
              <ul className="space-y-2">
                {items.map((n) => (
                  <li key={n._id} className={`card flex gap-3 p-4 text-sm ${n.read ? '' : 'border-gold bg-gold-100/40'}`}>
                    <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-gold'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{n.title}{!n.read && <span className="sr-only"> (unread)</span>}</p>
                      <p className="text-gray-600">{n.message}</p>
                      <p className="mt-1 text-xs text-gray-400">{date(n.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Pager meta={meta} onPage={setPage} />
            </>
          )}
      </Wrap>
    </Section>
  );
}

/* ───────────── Profile ───────────── */

function Profile() {
  const { user, setUser } = useAuth();
  const { register, handleSubmit, reset, formState: { errors, isDirty, isSubmitting } } = useForm({
    defaultValues: { name: user.name || '', phone: user.phone || '' },
  });

  const onSubmit = async (b) => {
    try {
      const r = await api.put('/auth/profile', { name: b.name.trim(), phone: b.phone.trim() });
      setUser(r.data.data);
      reset({ name: r.data.data.name || '', phone: r.data.data.phone || '' });
      toast('Profile saved');
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <Section title="Profile" desc="Your contact details for quotes and delivery updates.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card w-full max-w-md space-y-4 p-4 sm:p-6">
        <Field label="Full name" error={errors.name}>
          <input className="input" autoComplete="name" {...register('name', { required: 'Enter your name', minLength: { value: 2, message: 'Name is too short' } })} />
        </Field>
        <Field label="Email" hint={user.emailVerified ? 'Verified. Contact support to change it.' : 'Not verified yet. Contact support to change it.'}>
          <input className="input" value={user.email} disabled readOnly />
        </Field>
        <Field label="Phone" error={errors.phone} hint="Include the country code, for example +94 77 123 4567.">
          <input
            className="input" type="tel" autoComplete="tel"
            {...register('phone', { pattern: { value: /^\+?[\d\s-]{7,18}$/, message: 'Enter a valid phone number' } })}
          />
        </Field>
        <button className="btn-gold inline-flex w-full items-center gap-2 disabled:opacity-50 sm:w-auto" disabled={!isDirty || isSubmitting}>
          {isSubmitting && <Loader2 size={14} className="animate-spin" aria-hidden />} Save changes
        </button>
      </form>
    </Section>
  );
}

/* ───────────── Settings (password) ───────────── */

const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input ref={ref} type={show ? 'text' : 'password'} className="input pr-10" {...props} />
      <button
        type="button" tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-gray-400 hover:text-gray-600"
        onClick={() => setShow((s) => !s)}
      >
        {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
      </button>
    </div>
  );
});

const scorePassword = (p = '') => [p.length >= 8, /[a-z]/.test(p) && /[A-Z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
const METER = [['Too weak', 'bg-red-500'], ['Weak', 'bg-red-500'], ['Fair', 'bg-gold'], ['Good', 'bg-green-500'], ['Strong', 'bg-green-600']];

function Settings() {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const next = watch('newPassword');
  const score = scorePassword(next);

  const onSubmit = async ({ confirmPassword, ...body }) => {
    try {
      await api.put('/auth/password', body);
      toast('Password changed');
      reset();
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <Section title="Settings" desc="Keep your account secure.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card w-full max-w-md space-y-4 p-4 sm:p-6">
        <h3 className="font-bold">Change password</h3>
        <Field label="Current password" error={errors.currentPassword}>
          <PasswordInput autoComplete="current-password" {...register('currentPassword', { required: 'Enter your current password' })} />
        </Field>
        <Field label="New password" error={errors.newPassword}>
          <PasswordInput
            autoComplete="new-password"
            {...register('newPassword', {
              required: 'Enter a new password',
              minLength: { value: 8, message: 'Use at least 8 characters' },
              validate: (v, f) => v !== f.currentPassword || 'Choose a password you have not used here',
            })}
          />
        </Field>
        {next && (
          <div aria-live="polite">
            <div className="flex gap-1" aria-hidden>
              {[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= score ? METER[score][1] : 'bg-gray-200'}`} />)}
            </div>
            <p className="mt-1 text-xs text-gray-500">Strength: {METER[score][0]}</p>
          </div>
        )}
        <Field label="Confirm new password" error={errors.confirmPassword}>
          <PasswordInput
            autoComplete="new-password"
            {...register('confirmPassword', { required: 'Re-enter the new password', validate: (v, f) => v === f.newPassword || 'Passwords do not match' })}
          />
        </Field>
        <button className="btn-dark inline-flex w-full items-center gap-2 disabled:opacity-50 sm:w-auto" disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={14} className="animate-spin" aria-hidden />} Update password
        </button>
      </form>
    </Section>
  );
}

/* ───────────── Page shell ───────────── */

export default function Account() {
  useTitle('My Account');
  const { user } = useAuth();
  const unread = useUnread();

  return (
    <div className="container-x grid gap-5 py-5 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:gap-6 sm:py-8 lg:grid-cols-[250px_1fr]">
      <Toaster />

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-2">
          <div className="flex min-w-0 items-center gap-3 p-3 lg:hidden">
            <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">{initials(user.name)}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 p-3 lg:flex">
            <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">{initials(user.name)}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <nav aria-label="Account" className="account-tabs flex snap-x gap-1 overflow-x-auto overscroll-x-contain pb-1 lg:flex-col lg:border-t lg:border-gray-100 lg:pb-0 lg:pt-2">
            {tabs.map(([to, label, Icon]) => (
              <NavLink
                key={to} to={to} end={!to}
                className={({ isActive }) => `flex shrink-0 snap-start items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <Icon size={16} aria-hidden />
                <span>{label}</span>
                {to === 'notifications' && unread > 0 && (
                  <span className="ml-auto rounded-full bg-gold px-1.5 text-[11px] font-bold leading-5 text-white">{unread > 99 ? '99+' : unread}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      <main className="min-w-0">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="profile" element={<Profile />} />
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="imports" element={<Imports />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}