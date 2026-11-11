import { Download, Printer, RotateCcw } from 'lucide-react';

export default function CalculatorActions({ onReset, onDownload, hasResult }) {
  return <div className="no-print flex flex-wrap gap-2">
    <button type="submit" className="btn-gold">Calculate</button>
    <button type="button" className="btn-ghost" onClick={onReset}><RotateCcw size={15} />Reset</button>
    <button type="button" className="btn-ghost" disabled={!hasResult} onClick={onDownload}><Download size={15} />Download PDF</button>
    <button type="button" className="btn-ghost" disabled={!hasResult} onClick={() => window.print()}><Printer size={15} />Print</button>
  </div>;
}

export const money = (value, currency = 'Rs.') => value == null ? 'Rate not configured' : `${currency} ${Number(value).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const number = (value) => value == null ? 'Rate not configured' : Number(value).toLocaleString('en-LK', { maximumFractionDigits: 2 });
export const ResultRow = ({ label, value }) => <div className="flex justify-between gap-4 border-b border-gray-100 py-2"><span>{label}</span><strong className="text-right">{value}</strong></div>;

