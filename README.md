# Cars@855 — Vehicle Import & Sales Platform (MERN)

Public marketplace, Japan import requests, configurable import-cost calculator, customer portal and admin dashboard for Cars@855 (Sri Lanka).
Branding: charcoal `#333333`, gold `#C99833`, light grey `#E6E6E6` (from the supplied logos in `client/src/assets`).
Functionality is inspired by urbandrive.lk; the design and code are original.

## Status (read this first)
Verified: the client production build succeeds; server files pass syntax checks; 3 unit tests pass (`npm test`: calculator rule engine, input sanitiser); the API boots and returns correct responses for health, validation, auth-required and 404 cases.
**Not yet run:** anything that needs MongoDB, Cloudinary or SMTP (registration, CRUD, uploads, email) and a browser walk-through of the UI. Run through the checklist at the bottom on your machine.

## Requirements
Node 18+ (tested on 22), MongoDB (local or Atlas), optional Cloudinary and SMTP accounts.

## Setup
```bash
npm run install:all
cp server/.env.example server/.env     # fill in values
cp client/.env.example client/.env
```
**server/.env** — `MONGODB_URI` (e.g. `mongodb://127.0.0.1:27017/cars855` or an Atlas URI), `MONGODB_DNS_SERVERS` (optional comma-separated fallback DNS servers for Atlas SRV URIs; defaults to `1.1.1.1,8.8.8.8`), `JWT_SECRET` (long random string), `CLIENT_URL`, Cloudinary keys (needed for image/document upload), SMTP settings (without SMTP, emails are logged to the console), and `ADMIN_EMAIL` / `ADMIN_PASSWORD` for the seed.

If the server reports `ECONNREFUSED 127.0.0.1:27017`, MongoDB is not running at the URI configured in `server/.env`. Start the local MongoDB service or replace `MONGODB_URI` with a reachable MongoDB Atlas connection string before running the API.

### Admin account
```bash
npm run seed
```
Creates the admin user, vehicle categories, default hero text and sample FAQs. Log in at `/login`; admins land on `/admin`. Create staff users via `POST /api/admin/staff` (permissions: vehicles, imports, inquiries, quotations, content, tax, customers, reports). Users with the `content` permission can manage the mixed image/video gallery from **Admin → Media Gallery**.

### Tax configuration (required before the calculator works)
No duty or tax rates are built in. In **Admin → Tax Configuration** enter the rules published by the relevant authority (percent / fixed / per-cc, based on CIF or running total), the category, fuel type, engine range and effective date. Edits keep a history; "delete" deactivates. Until a matching active configuration exists the calculator replies that no estimate is available.

### Contact details
Phone, WhatsApp, email and address are **not invented**. Set them in **Admin → Website Content**; the WhatsApp button, click-to-call and footer appear once set.

## Run
```bash
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:5173
```
Production: `npm run build` (outputs `client/dist`), then `NODE_ENV=production npm --prefix server start`. In production, cookies are `Secure` + `SameSite=None`, so serve both over HTTPS and set `CLIENT_URL` to your site origin.

## API summary (all under `/api`, JSON `{success, data, meta?}`)
| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register, /login, /logout, /forgot-password, /reset-password, /verify-email`; `GET /auth/me`; `PUT /auth/profile, /auth/password` |
| Vehicles | `GET /vehicles` (q, make, model, vehicleCategory, fuelType, transmission, condition, importStatus, yearMin/Max, priceMin/Max, ccMin/Max, mileageMax, sort, page, limit), `GET /vehicles/facets`, `GET /vehicles/:idOrSlug`, `POST/PUT/DELETE` (staff) |
| Catalogue | `/categories`, `/auctions`, `/testimonials`, `/faqs` — public GET, permissioned writes; `GET/PUT /settings` |
| Inquiries | `POST /inquiries` (guest or logged in), `GET/PUT/DELETE` (customers see only their own) |
| Imports | `POST/GET /import-requests`, `GET/PUT /:id`, `PATCH /:id/status`, `PATCH /:id/cancel` |
| Quotations | `GET/POST/PUT /quotations`, `PATCH /:id/status` (customers: accept/decline own, non-draft) |
| Favorites | `GET/POST /favorites`, `DELETE /favorites/:vehicleId` |
| Tax | `GET/POST/PUT/DELETE /tax-configurations`; `POST /calculator/estimate` |
| Other | `/notifications`, `/gallery`, `/uploads/*`, `/admin/dashboard, /customers, /staff, /reports?type=&format=csv` |

## Security notes
Helmet, CORS allow-list, rate limits (stricter on auth), zod validation with field whitelisting, Mongo-operator stripping, bcrypt (via `bcryptjs`, same algorithm, no native build), HTTP-only JWT cookie, ownership checks on every customer resource, private Cloudinary uploads served through 5-minute signed URLs, CSV-injection guard on exports, password/token fields never serialised.

## Known gaps / next steps
- Controllers are inlined in route files for compactness; split if the codebase grows.
- Auction listings are admin-managed only (no live provider). The model is isolated so an API sync job can feed it later.
- Missing from the admin UI: image gallery reordering, vehicle document management, staff-permission editor (API exists), demurrage/leasing calculators and blog from the reference site.
- Static pages (About, Privacy, Terms…) contain placeholder copy — replace with reviewed content.
- No frontend automated tests yet.

## Manual verification checklist
Register → verify email link → login · create categories/vehicle (published) with images · browse/filter/sort · inquiry from vehicle page · submit import request · change status in admin and confirm the customer notification · create/send/accept a quotation · add tax config, then run calculator · export a CSV · confirm a customer gets 404 on another customer's import request id.
