export const lkr = (n) => (n == null || n === '' ? '—' : `LKR ${Number(n).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`);
export const num = (n, unit = '') => (n == null ? '—' : `${Number(n).toLocaleString()}${unit}`);
export const date = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const IMPORT_STATUSES = ['Submitted', 'Under Review', 'Vehicle Searching', 'Vehicle Found', 'Quotation Sent', 'Awaiting Approval', 'Purchase Confirmed', 'Vehicle Purchased', 'Shipping', 'Arrived in Sri Lanka', 'Customs Clearance', 'Ready for Delivery', 'Delivered', 'Cancelled'];
export const waLink = (number, text) => number ? `https://wa.me/${String(number).replace(/\D/g, '')}?text=${encodeURIComponent(text)}` : null;
export const FUELS = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric'];
export const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT', 'Semi-Automatic'];
