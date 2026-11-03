import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;
const getTransport = () => {
  if (!env.smtp.host) return null;
  transporter ||= nodemailer.createTransport({ host: env.smtp.host, port: env.smtp.port, secure: env.smtp.port === 465, auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined });
  return transporter;
};
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const layout = (title, bodyHtml, cta) => `<!doctype html><html><body style="margin:0;background:#f3f3f3;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="background:#333;padding:20px 28px;color:#fff;font-size:22px;font-weight:bold">Cars<span style="color:#C99833">@</span>855</td></tr>
<tr><td style="padding:28px;color:#333;line-height:1.6"><h2 style="margin-top:0">${esc(title)}</h2>${bodyHtml}
${cta ? `<p style="margin:28px 0"><a href="${esc(cta.url)}" style="background:#C99833;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">${esc(cta.label)}</a></p>` : ''}
</td></tr><tr><td style="padding:16px 28px;background:#fafafa;color:#888;font-size:12px">You received this email because of activity on your Cars@855 account.</td></tr>
</table></td></tr></table></body></html>`;

export async function sendEmail(to, subject, html) {
  const t = getTransport();
  if (!t) { console.log(`[email:not-configured] to=${to} subject="${subject}"`); return false; }
  try { await t.sendMail({ from: env.smtp.from || env.smtp.user, to, subject, html }); return true; }
  catch (e) { console.error('Email failed:', e.message); return false; } // never break the request over email
}
export const templates = {
  welcome: (name, url) => ['Welcome to Cars@855', layout(`Welcome, ${name}`, '<p>Your account has been created. Please verify your email address to get started.</p>', { url, label: 'Verify email' })],
  reset: (name, url) => ['Reset your password', layout('Password reset', `<p>Hi ${esc(name)}, use the button below to choose a new password. The link expires in 1 hour. If you did not request this, ignore this email.</p>`, { url, label: 'Reset password' })],
  inquiry: (name) => ['We received your inquiry', layout('Inquiry received', `<p>Hi ${esc(name || 'there')}, thank you for contacting Cars@855. Our team will respond shortly.</p>`)],
  importReceived: (name, no, url) => ['Import request received', layout('Import request received', `<p>Hi ${esc(name)}, your request <b>${esc(no)}</b> has been submitted. You can follow its progress from your dashboard.</p>`, { url, label: 'Track request' })],
  importStatus: (name, no, status, url) => [`Import ${no}: ${status}`, layout('Import status updated', `<p>Hi ${esc(name)}, your import request <b>${esc(no)}</b> is now <b>${esc(status)}</b>.</p>`, { url, label: 'View progress' })],
  quotation: (name, no, total, url) => [`Quotation ${no}`, layout('New quotation', `<p>Hi ${esc(name)}, quotation <b>${esc(no)}</b> is ready. Total: <b>LKR ${Number(total).toLocaleString()}</b>.</p>`, { url, label: 'View quotation' })],
  vehicleStatus: (name, vehicle, status, url) => [`${vehicle} is now ${status}`, layout('Vehicle availability update', `<p>Hi ${esc(name)}, a vehicle you saved, <b>${esc(vehicle)}</b>, is now <b>${esc(status)}</b>.</p>`, { url, label: 'View vehicle' })],
};
