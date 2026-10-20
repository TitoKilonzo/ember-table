# Ember Table Restaurant Commerce Starter

A mobile-first storefront and staff workspace for Ember Table in Westlands, open 24 hours a day. Contact: +254 743 336 009 or info@embertable.com. The menu uses a **Burnt Orange + Vanilla** design system. Built with Next.js App Router, React, TypeScript, Tailwind CSS, Appwrite-ready persistence, and an Odoo bridge contract. The direct dependencies are pinned to reviewed current releases to avoid silently drifting direct dependency versions. npm audit is enabled in `.npmrc`.

> **Current state:** the customer storefront, menu filtering, cart, checkout UI, Appwrite REST persistence adapter, email/password authentication, email verification and server-checked staff access are implemented. The staff workspace still displays sample operational data; it is not connected to live restaurant operations. The Odoo connection requires a purpose-built bridge module. M-Pesa is intentionally disabled until its request/callback/reconciliation workflow is implemented and tested.

## Features in this starter

- Responsive customer storefront with search, menu-category filtering, product cards and local cart persistence.
- Checkout for pickup or delivery, with server-side item, quantity and total validation.
- Demo API: `POST /api/orders`; system health: `GET /api/health`.
- Optional Appwrite TablesDB order persistence through a server-side API key.
- Appwrite Auth registration and sign-in with email verification and HttpOnly sessions.
- Staff access to `/admin` restricted to the configured, verified administrator and assistant manager emails.
- Contact page with a WhatsApp/email selector for enquiries and support.
- Optional secure Odoo bridge call after an order is persisted.
- Staff workspace at `/admin` with overview, sample orders, kitchen queue, menu preview, payments and integrations sections.
- PWA web manifest, branded SVG mark, TypeScript strict mode and schema tests.

## Requirements

- Node.js 22+
- npm 10.9+ (the project pins the npm CLI version used during development in `packageManager`)
- Modern browsers: Safari 16.4+, Chrome 111+, or Firefox 128+ (Tailwind CSS 4 baseline)
- Appwrite Cloud or self-hosted Appwrite for persistent orders (optional during UI development)
- Odoo deployment and suitable external API/module access before enabling POS synchronization

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. On Windows PowerShell, copy the environment template with `Copy-Item .env.example .env.local`; on macOS/Linux use `cp .env.example .env.local`.

The app can be explored without setting `.env.local` values. In this mode, `/api/orders` validates and returns a demo order response but does not persist it across server restarts. The dashboard uses explicitly labelled sample data. A successful checkout in demo mode is **not a live restaurant order**.

Useful checks:

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run security:audit
```

`npm install` runs npm audit by default and generates `package-lock.json` on the first install. Commit that lockfile after a successful install so later machines and CI use the exact same dependency tree. Run `npm run security:audit` (equivalent to `npm audit --audit-level=low`) to fail the check if any low-or-higher severity advisory is present. Advisory databases change over time, so rerun the audit before releases.

## Brand and UI

- Vanilla: `#FFF7E8`
- Paper surface: `#FFFCF6`
- Burnt Orange: `#C6532C`
- Deep Burnt Orange: `#9F3F20`
- Ink: `#29241F`
- Herb accent: `#667348`

Before launch, add the full street address, confirm delivery coverage and fee, and add legal and allergen information. Menu photos currently use Unsplash images for illustration; replace them with photos owned or licensed by the restaurant.

## Appwrite setup

1. Create an Appwrite project and copy the endpoint and project ID.
2. Create a database with ID `restaurant_commerce` (or change `APPWRITE_DATABASE_ID`).
3. Create a table with ID `orders` (or change `APPWRITE_ORDERS_TABLE_ID`).
4. Create the columns below. Keep the API key only on the server.
5. Create a server API key limited to the required row operations and set the variables in `.env.local`.
6. Restrict database/table access. Do not grant public create/read/update permissions simply to make checkout work; the server API key is used by the backend.

Suggested `orders` table columns:

| Column key | Type | Required | Notes |
|---|---|---:|---|
| `orderNumber` | varchar | Yes | Use size 40 |
| `customerName` | varchar | Yes | Size 100 |
| `customerPhone` | varchar | Yes | Size 30 |
| `customerEmail` | varchar | No | Size 180; blank allowed |
| `customer` | varchar | Yes | JSON-encoded checkout customer fields; size large enough for 500 chars |
| `fulfilmentType` | varchar | Yes | `pickup` or `delivery` |
| `paymentMethod` | varchar | Yes | `pay_on_fulfilment` in this version |
| `paymentStatus` | varchar | Yes | `unpaid` in this version |
| `status` | varchar | Yes | Starts as `received` |
| `address` | varchar | No | Delivery address; choose a safe supported size for your deployment |
| `instructions` | varchar | No | Kitchen notes; choose a safe supported size |
| `items` | varchar | Yes | JSON-encoded order line snapshots; size large enough for your expected maximum |
| `subtotal` | integer | Yes | Whole KES for this demo menu |
| `deliveryFee` | integer | Yes | Whole KES |
| `total` | integer | Yes | Whole KES |
| `integrationStatus` | varchar | Yes | `pending`, `not_configured`, `synced` or `failed` |
| `odooOrderId` | varchar | No | Odoo bridge response reference; size 100 |
| `odooSyncMessage` | varchar | No | Latest sync result/message; size 500 |
| `idempotencyKey` | varchar | Yes | Unique key generated at checkout |
| `createdAt` | datetime | Yes | ISO 8601 timestamp |

For production, validate your actual Appwrite column limits and consider a normalized `order_items` table rather than storing line items as a JSON string. Add a normalized `order_items` table, integration attempt history and payment provider references as you implement retry and payment workflows.

Appwrite config variables:

```dotenv
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://<REGION>.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<PROJECT_ID>
APPWRITE_ENDPOINT=https://<REGION>.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=<PROJECT_ID>
APPWRITE_API_KEY=<SERVER_ONLY_API_KEY>
APPWRITE_DATABASE_ID=restaurant_commerce
APPWRITE_ORDERS_TABLE_ID=orders
APP_URL=https://your-production-domain.example
STAFF_ADMIN_EMAIL=admin@embertable.com
STAFF_MANAGER_EMAIL=manager@embertable.com
```

Authentication requests run through server-side Appwrite REST calls in `lib/auth-server.ts`; the browser client utility remains available for other user-scoped features. Never add an API key to a `NEXT_PUBLIC_` variable.

### Authentication and staff accounts

1. Enable email/password authentication in the Appwrite project. Set the public and server Appwrite endpoint/project ID values above.
2. Configure Appwrite's email delivery and add the exact site origin to the project's allowed web platforms. `APP_URL` must be the canonical site origin used for verification links (for local development, `http://localhost:3000`).
3. Set `STAFF_ADMIN_EMAIL` and `STAFF_MANAGER_EMAIL` to the two staff email addresses. These server-only values determine which verified account receives the administrator or Assistant Manager role; public registration has no role selector.
4. Create each staff account through `/register` with the staff email, complete the email verification link, then sign in. Use the passwords supplied for your test accounts when creating them; passwords are not stored in this repository.
5. Set a strong, unique password for each account before production. Do not reuse test passwords or put passwords in source files, `.env` files, browser code or documentation.

The `/admin` page checks the Appwrite session and email verification on the server for every page request. The session token is kept in an HttpOnly, same-site cookie. User roles are not accepted from browser input. Ordinary registered users remain customers and cannot access the staff workspace. Reset staff passwords through the Appwrite account process and remove staff access by changing the server-side staff email configuration.

Email verification requires working Appwrite email delivery. If the verification link does not arrive, sign in and use the resend option. Configure the exact production callback origin in Appwrite before launch.

## Odoo integration contract

Set:

```dotenv
ODOO_BRIDGE_URL=https://your-odoo-host.example/your-secure-web-order-route
ODOO_BRIDGE_TOKEN=<LONG_RANDOM_SERVER_SIDE_SECRET>
```

`lib/odoo-bridge.ts` sends a POST body with `external_order_id`, `channel`, customer details, fulfilment details, line item product identifiers, totals and instructions. The external order ID is stable for an idempotency key so your Odoo module should enforce uniqueness on it.

**The bridge endpoint does not exist until you implement it in your Odoo environment.** It should validate the bearer token, map website product IDs to real Odoo products, apply Odoo pricing/tax rules, route the order into the correct POS/restaurant workflow, map payment state safely, and return a JSON response containing `id` or `order_id`. Do not assume a generic `pos.order.create` call will land in the right restaurant POS session or preparation display.

Before going live, define the order lifecycle and source of truth for each field, verify your Odoo version/hosting/API plan, and test duplicates, timeout, API outage, session closure, taxes, cancellations and refunds. This starter stores the immediate bridge outcome on the order; a durable retry/outbox worker and integration attempt history are still next-step production work.

## Payment status

Checkout offers payment on collection or delivery in this build. M-Pesa appears as setup-required and is rejected by the API; no live M-Pesa charge is performed. Before enabling M-Pesa, implement Daraja STK Push initiation, callback verification/reconciliation, duplicate callback handling, status queries, payment attempt persistence, timeouts and refund handling. Never mark an order paid solely because the browser says payment succeeded.

## Before production

- Replace sample staff dashboard data with live restaurant operations and protect any new dashboard APIs with the same server-side authorization.
- Synchronize the real Odoo menu with price/version/availability checks at checkout.
- Add a durable outbox/worker and safe retry policy for Odoo failures.
- Add payment provider workflows and reconciliation before claiming online payments.
- Add per-branch capacity, opening hours, delivery zones and accurate fees.
- Add rate limiting, request logging, error tracking, secret rotation, backups and alerting.
- Add E2E tests against a staging Appwrite project and Odoo test database.
- Confirm privacy policy, data-retention policy, allergen copy and local legal/payment obligations.

## Project structure

```text
app/
  api/health/route.ts       # deployment and integration health
  api/auth/                 # Appwrite account, session and verification endpoints
  api/orders/route.ts       # server-side order validation and creation
  admin/page.tsx            # server-side staff access check
  admin/dashboard.tsx       # staff operations UI preview
  contact/page.tsx          # WhatsApp and email contact selector
  login/page.tsx
  register/page.tsx
  verify/page.tsx
  globals.css
  layout.tsx
  page.tsx
components/
  auth-form.tsx
  contact-options.tsx
  storefront.tsx            # customer shop + cart + checkout
lib/
  auth-server.ts            # server-only Appwrite session and role helpers
  appwrite-client.ts        # public Appwrite Auth client utility
  appwrite-server.ts        # server-only Appwrite REST persistence
  format.ts
  menu.ts                   # demo menu; replace with synced product data
  odoo-bridge.ts            # secure custom bridge adapter
  order-schema.ts           # checkout validation
public/
tests/
```
