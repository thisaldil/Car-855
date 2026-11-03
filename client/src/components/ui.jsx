import { AlertCircle, Inbox } from 'lucide-react';
export const Spinner = () => <div className="py-16 text-center text-sm text-gray-400">Loading…</div>;
export const Skeleton = ({ className = 'h-64' }) => <div className={`animate-pulse rounded-2xl bg-gray-200 ${className}`} />;
export const ErrorState = ({ message = 'Could not load data.', onRetry }) => <div className="card p-8 text-center"><AlertCircle className="mx-auto text-red-500" /><p className="mt-2 text-sm text-gray-600">{message}</p>{onRetry && <button onClick={onRetry} className="btn-ghost mt-3">Try again</button>}</div>;
export const Empty = ({ title = 'Nothing here yet', hint }) => <div className="card p-10 text-center"><Inbox className="mx-auto text-gray-300" size={36} /><p className="mt-2 font-semibold">{title}</p>{hint && <p className="text-sm text-gray-500">{hint}</p>}</div>;
export const Field = ({ label, error, children }) => <div><label className="label">{label}</label>{children}{error && <p className="mt-1 text-xs text-red-600">{error.message || error}</p>}</div>;
export const Badge = ({ children, tone = 'gray' }) => {
  const t = { gray: 'bg-gray-100 text-gray-700', gold: 'bg-gold-100 text-gold-600', green: 'bg-green-100 text-green-700', red: 'bg-red-100 text-red-700', blue: 'bg-blue-100 text-blue-700' }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${t}`}>{children}</span>;
};
export const Pager = ({ meta, onPage }) => meta && meta.pages > 1 ? (
  <div className="mt-8 flex items-center justify-center gap-3 text-sm">
    <button className="btn-ghost" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</button>
    <span>Page {meta.page} of {meta.pages}</span>
    <button className="btn-ghost" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>Next</button>
  </div>) : null;
