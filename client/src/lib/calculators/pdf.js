import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const money = (value) => value == null ? 'Rate not configured' : `Rs. ${Number(value).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const stamp = new Date();
const reference = `CALC-${stamp.toISOString().slice(0, 10).replaceAll('-', '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export function buildPdf({ title, inputs, rows, totals = [], disclaimer, schedule = [], siteName = 'Cars@855', contact = 'Contact Cars@855 for assistance.' }) {
  const doc = new jsPDF();
  doc.setFontSize(18); doc.setTextColor(51, 51, 51); doc.text(siteName, 14, 18);
  doc.setFontSize(14); doc.text(title, 14, 29);
  doc.setFontSize(9); doc.setTextColor(100, 100, 100);
  doc.text(`Generated ${stamp.toLocaleString()}  |  Reference ${reference}`, 14, 36);
  autoTable(doc, { startY: 43, head: [['Inputs', 'Value']], body: inputs.map(([label, value]) => [label, String(value)]), theme: 'grid', headStyles: { fillColor: [201, 152, 51] } });
  autoTable(doc, { startY: doc.lastAutoTable.finalY + 8, head: [['Item', 'Tax base', 'Rate', 'Amount']], body: rows.map((row) => [row.type || row.label, row.taxBase == null ? '—' : money(row.taxBase), row.rate == null ? '—' : `${row.rate}`, money(row.amount ?? row.usd)]), theme: 'grid', headStyles: { fillColor: [51, 51, 51] } });
  let y = doc.lastAutoTable.finalY + 8;
  totals.forEach(([label, value]) => { doc.setFontSize(10); doc.setTextColor(51, 51, 51); doc.text(`${label}: ${money(value)}`, 14, y); y += 6; });
  if (disclaimer) { doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.text(doc.splitTextToSize(disclaimer, 180), 14, y + 4); y += 14; }
  if (schedule.length) {
    doc.addPage();
    autoTable(doc, { startY: 18, head: [['Month', 'Opening balance', 'Interest', 'Principal', 'Closing balance']], body: schedule.map((line) => [line.month, money(line.opening), money(line.interest), money(line.principal), money(line.closing)]), theme: 'grid', headStyles: { fillColor: [51, 51, 51] } });
  }
  const pages = doc.internal.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
    doc.text(`${contact}  |  Page ${page} of ${pages}`, 14, 289);
  }
  return { doc, reference };
}

export { money };

