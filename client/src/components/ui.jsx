import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Inbox, Loader2, RotateCw, X } from 'lucide-react';

/* ───────────── Loading states ───────────── */

export const Spinner = ({ label = 'Loading…' }) => (
  <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
    <Loader2 size={16} className="animate-spin" aria-hidden /> {label}
  </div>
);

export const Skeleton = ({ className = 'h-64' }) => (
  <div aria-hidden className={`animate-pulse rounded-2xl bg-gray-200 ${className}`} />
);

export const SkeletonList = ({ rows = 3, className = 'h-28' }) => (
  <div role="status" aria-label="Loading" className="space-y-3">
    {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className={className} />)}
  </div>
);

/* ───────────── Empty / error ───────────── */

export const ErrorState = ({ message = 'Could not load data.', onRetry }) => (
  <div role="alert" className="card p-8 text-center">
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50">
      <AlertCircle className="text-red-500" size={22} aria-hidden />
    </span>
    <p className="mt-3 text-sm text-gray-600">{message}</p>
    {onRetry && (
      <button onClick={() => onRetry()} className="btn-ghost mt-4 inline-flex items-center gap-2">
        <RotateCw size={14} aria-hidden /> Try again
      </button>
    )}
  </div>
);

export const Empty = ({ title = 'Nothing here yet', hint, icon: Icon = Inbox, action }) => (
  <div className="card p-10 text-center">
    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gray-50">
      <Icon className="text-gray-300" size={26} aria-hidden />
    </span>
    <p className="mt-3 font-semibold">{title}</p>
    {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{hint}</p>}
    {action && (
      <Link to={action.to} className="btn-gold mt-5 inline-block">{action.label}</Link>
    )}
  </div>
);

/* ───────────── Form field (auto-wires label, id and aria) ───────────── */

export const Field = ({ label, error, hint, children }) => {
  const id = useId();
  const msg = error && (error.message || error);
  const only = Children.count(children) === 1 && isValidElement(children);
  const control = only
    ? cloneElement(children, {
        id: children.props.id || id,
        'aria-invalid': msg ? true : undefined,
        'aria-describedby': msg ? `${id}-err` : hint ? `${id}-hint` : undefined,
      })
    : children;
  return (
    <div>
      <label htmlFor={only ? children.props.id || id : undefined} className="label">{label}</label>
      {control}
      {hint && !msg && <p id={`${id}-hint`} className="mt-1 text-xs text-gray-500">{hint}</p>}
      {msg && <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-red-600">{msg}</p>}
    </div>
  );
};

/* ───────────── Badge + status → tone mapping ───────────── */

const TONES = {
  gray: 'bg-gray-100 text-gray-700',
  gold: 'bg-gold-100 text-gold-600',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
};
const DOTS = { gray: 'bg-gray-400', gold: 'bg-gold', green: 'bg-green-500', red: 'bg-red-500', blue: 'bg-blue-500' };

export const Badge = ({ children, tone = 'gray', dot = false }) => (
  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone] || TONES.gray}`}>
    {dot && <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOTS[tone] || DOTS.gray}`} />}
    {children}
  </span>
);

/** Pick a badge colour from a free-text status such as "accepted" or "Cancelled". */
export const statusTone = (status = '') => {
  const s = String(status).toLowerCase();
  if (/(accept|complete|deliver|resolv|closed|approved|registered|verified)/.test(s)) return 'green';
  if (/(reject|cancel|declin|expired|fail)/.test(s)) return 'red';
  if (/(sent|pending|new|open|progress|review)/.test(s)) return 'gold';
  return 'gray';
};

/* ───────────── Stat card ───────────── */

export const StatCard = ({ icon: Icon, label, value, to }) => {
  const body = (
    <>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 break-words text-sm text-gray-500">{label}</p>
        {Icon && <Icon size={18} className="text-gold" aria-hidden />}
      </div>
      <p className="mt-2 text-3xl font-extrabold tabular-nums">{value ?? '…'}</p>
    </>
  );
  return to
    ? <Link to={to} className="card block p-5 transition hover:border-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">{body}</Link>
    : <div className="card p-5">{body}</div>;
};

/* ───────────── Pagination ───────────── */

const pageWindow = (page, total) => {
  const keep = [...new Set([1, total, page - 1, page, page + 1])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  return keep.flatMap((n, i) => (i && n - keep[i - 1] > 1 ? [`gap-${n}`, n] : [n]));
};

export const Pager = ({ meta, onPage }) => {
  if (!meta || meta.pages <= 1) return null;
  const { page, pages } = meta;
  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1.5 text-sm">
      <button className="btn-ghost inline-flex items-center gap-1" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={14} aria-hidden /> Previous
      </button>
      {pageWindow(page, pages).map((n) => typeof n === 'string'
        ? <span key={n} aria-hidden className="px-1 text-gray-400">…</span>
        : <button
            key={n}
            onClick={() => onPage(n)}
            aria-current={n === page ? 'page' : undefined}
            className={`h-9 min-w-9 rounded-lg px-2 font-medium tabular-nums ${n === page ? 'bg-brand text-white' : 'hover:bg-gray-100'}`}
          >{n}</button>)}
      <button className="btn-ghost inline-flex items-center gap-1" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next <ChevronRight size={14} aria-hidden />
      </button>
    </nav>
  );
};

/* ───────────── Confirm dialog (replaces window.confirm) ───────────── */

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Keep it', tone = 'danger', loading = false, onConfirm, onClose }) {
  const cancelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-msg" className="card w-full max-w-sm p-4 shadow-xl sm:p-6">
        <h3 id="dlg-title" className="text-lg font-bold">{title}</h3>
        <p id="dlg-msg" className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelRef} className="btn-ghost w-full sm:w-auto" onClick={onClose} disabled={loading}>{cancelLabel}</button>
          <button
            disabled={loading}
            onClick={onConfirm}
            className={tone === 'danger'
              ? 'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 sm:w-auto'
              : 'btn-gold w-full sm:w-auto inline-flex items-center gap-2 disabled:opacity-50'}
          >
            {loading && <Loader2 size={14} className="animate-spin" aria-hidden />}{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Toasts (replaces window.alert) ─────────────
   Call toast('Saved') / toast.error('Failed') from anywhere,
   and render <Toaster /> once (Account page or App root).      */

let toastId = 0;
const listeners = new Set();
export const toast = (message, type = 'success') => {
  const t = { id: ++toastId, message, type };
  listeners.forEach((fn) => fn(t));
};
toast.error = (message) => toast(message, 'error');

export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const on = (t) => {
      setItems((p) => [...p.slice(-2), t]);
      setTimeout(() => setItems((p) => p.filter((x) => x.id !== t.id)), 4500);
    };
    listeners.add(on);
    return () => listeners.delete(on);
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end">
      {items.map((t) => (
        <div
          key={t.id}
          role={t.type === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl border bg-white px-4 py-3 text-sm shadow-lg ${t.type === 'error' ? 'border-red-200' : 'border-green-200'}`}
        >
          {t.type === 'error'
            ? <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" aria-hidden />
            : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" aria-hidden />}
          <span className="min-w-0 flex-1 break-words">{t.message}</span>
          <button aria-label="Dismiss" className="text-gray-400 hover:text-gray-600" onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))}>
            <X size={14} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}