# BLACKROOT

A four-tier clearance network built on the MERN stack — **Guest → Verified → Operative → Sysadmin** — where what
you can see, post, and even know exists is enforced on the server, at the database query layer, never just hidden
behind a UI element. Dark jade/emerald terminal aesthetic; unlocking gated content triggers a decrypt-reveal
animation.

**Live:**
- Frontend: `https://blackroots.vercel.app`
- Backend: `https://blackroot-mfjg.onrender.com/api`

## Stack

- **Backend:** Node, Express, TypeScript, MongoDB/Mongoose, JWT (httpOnly cookies), bcrypt, Zod validation,
  express-rate-limit, Helmet, Jest + Supertest
- **Frontend:** React 18, TypeScript, Vite, React Router, Tailwind CSS, Framer Motion
- **Hosting:** Render (backend), Vercel (frontend), MongoDB Atlas (database)

## Why the access control actually holds up

The single most important design decision: **clearance filtering happens in the database query, not after the
fetch.** `entryController.clearanceFilter()` builds a Mongo `$in` clause from the requester's role and passes it
directly into `Entry.find()`. A guest's request for a channel's entries never even retrieves operative-only rows
from MongoDB — there's no code path where restricted content sits in memory on the server and gets filtered
before the response goes out.

Direct-by-ID entry fetches (`GET /api/entries/:entryId`) go through a second gate: if the requester's clearance
doesn't meet the entry's, the response is a redacted placeholder (`{ locked: true, requiredClearance }`) — no
title, body, author, or replies ever serialize into JSON.

Other things worth knowing:
- Sessions are server-side revocable (`Session` model + `jti`), so logout and admin "revoke sessions" actually
  invalidate — not just clearing client cookies.
- Account lockout after 5 failed logins (15 min), with a generic error message so login doesn't confirm which
  emails are registered.
- Every admin action (role change, clearance change, purge, session revoke, activation code regeneration) writes
  to `AuditLog`.
- A role can never be changed by any path except the sysadmin-gated `PATCH /admin/users/:id/role` route — role
  is always read from the verified JWT (`req.user`), never trusted from a request body.
- Unauthorized access to admin routes returns `404`, not `403`, so an unprivileged account can't even confirm
  the console exists.

## Password reset & account activation — no email/SMS provider needed

This deployment has no outbound email or SMS service, so two things work differently than a typical app:

- **Password reset** uses a one-time **recovery code** instead of an emailed link — functionally identical to
  2FA backup codes. It's generated per-user at registration, shown exactly once (`RecoveryCodeReveal` component),
  and only its bcrypt hash is ever stored. `POST /api/auth/forgot-password` takes email + recovery code + new
  password, resets the password, revokes every existing session, and issues a fresh rotated code. If a user
  loses their code entirely, only a Sysadmin can restore access (same failure mode as losing 2FA backup codes
  anywhere else).
- **Guest signup** is gated behind a single, **shared, reusable activation code** instead of one-time invite
  codes issued per person. A Sysadmin sets/regenerates it from the Admin console's Activation tab, and any
  number of people can register with that same code until it's regenerated — regenerating only blocks *future*
  signups, never affects accounts that already registered. This avoids the old model where a Sysadmin had to
  mint and hand-deliver a fresh code for every single signup.
- **Account activation itself is instant** (`activatedAt` set at creation) rather than gated behind an emailed
  activation link. Guest is already the network's most-restricted tier, so an email gate in front of it would
  only add operational overhead without changing what an "unactivated" account could do differently.

## Search, flagging, editing, and full admin management

- `GET /api/entries/search` is wired to a real search bar (desktop nav + mobile drawer) and results page —
  clearance-filtered at the database layer like everything else.
- Any Verified+ account can flag an entry for review from the Entry view.
- Entry authors (and Sysadmins) can edit their own entries inline.
- The admin console has five tabs: **Users** (roles, session revocation), **Channels** (create, adjust clearance
  requirements, lock/archive), **Entries** (filter by channel, reassign clearance, lock, purge), **Activation**
  (view/regenerate the shared signup code), and **Audit Log** (every privileged action, permanently).

## Public site & the verification flow

- `/` is a full public landing page — hero with an animated particle-network canvas background, clearance tier
  breakdown, the escalation path explained step by step, features, testimonials, a rules preview, and an FAQ. No
  login required.
- `/verify` hosts the complete Community Rules document plus the one and only self-service role change in the
  system: a logged-in Guest account can accept the rules and be upgraded to Verified immediately
  (`POST /api/auth/verify`, guest-only, audit-logged).
- The authenticated app (channels, entries, admin console) lives under `/dashboard`.
- Every page has a way back to the landing page — the nav logo, a footer link, and explicit breadcrumbs on
  channel/entry views.
- Fully responsive with a hamburger nav (landing page and the authenticated app shell both collapse below `md`).

## Local development setup

### 1. MongoDB
Use a local install or a free Atlas cluster — you just need a connection string.

### 2. Backend
```bash
cd backend
cp .env.example .env      # fill in MONGO_URI and generate two long random JWT secrets
npm install
npm run seed               # creates one demo account per role, sample channels/entries, and the activation code
npm run dev                 # http://localhost:4000
```

Demo accounts seeded locally (all use password `NeonBreach#2026`) — **local development only, see the
production security note below**:

| Role | Email |
|---|---|
| guest | guest@blackroot.dev |
| verified | verified@blackroot.dev |
| operative | operative@blackroot.dev |
| sysadmin | sysadmin@blackroot.dev |

Seeded network activation code: `BLACKROOT-JOIN` (shared, reusable — see above). Set
`REQUIRE_INVITE_CODE=false` in `.env` to allow open registration without a code at all.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### 4. Tests
```bash
cd backend
npm test
```
Covers: role hierarchy logic, login lockout, redacted-placeholder behavior, no-leak guarantee on channel
listings, admin-route blocking, and privilege-escalation resistance. Test files are excluded from the production
`tsc` build (see `tsconfig.json`) since they're never part of the running server.

## Deployment

### Backend — Render
| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |

**Never use `npm run dev` in production** — that runs `nodemon` + `ts-node`, which type-checks and compiles the
whole project in memory on every boot and will OOM-crash on a small instance. `npm run build` compiles once at
build time; `npm start` runs the plain compiled JS with no TypeScript tooling loaded at runtime.

Environment variables to set on Render: everything in `.env.example`, plus:
- `NODE_ENV=production`
- `CLIENT_ORIGIN` = your exact Vercel URL (e.g. `https://blackroots.vercel.app`, no trailing slash) — CORS
  will reject requests from anywhere else
- Real, long, random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — never reuse the `.env.example`
  placeholders

After the first successful deploy, seed the production database **once**, from Render's Shell tab:
```bash
npm run seed
```

### Frontend — Vercel
| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Environment variable: `VITE_API_URL` = your Render backend URL **including the `/api` suffix**
(e.g. `https://blackroot-mfjg.onrender.com/api`). Vite bakes env vars in at build time, so changing this requires
a redeploy to take effect, not just a save.

`frontend/vercel.json` is required for client-side routing to work on direct navigation/refresh — without it,
refreshing on any route other than `/` (like `/dashboard` or `/register`) returns Vercel's own 404 instead of
loading the app, since Vercel's static server looks for a literal file at that path before React Router ever
runs:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Cross-origin cookies
Because the frontend and backend live on different domains in production, auth cookies use `sameSite: "none"`
(paired with `secure: true`) in production and `sameSite: "lax"` locally — see the `cookieOpts` comment in
`authController.ts`. `SameSite=Lax` cookies are never attached to cross-origin fetch/XHR requests, only top-level
navigations, so without this the deployed frontend would appear to log in successfully but silently fail to send
the auth cookie on every subsequent request.


## Design tokens (Tailwind, `tailwind.config.ts`)

| Token | Hex | Use |
|---|---|---|
| void | `#050D09` | base background |
| panel | `#0A1912` | cards, nav |
| jade | `#2FE6A6` | primary accent, unlocked content |
| emerald | `#0E6B4C` | secondary fills/badges |
| mint | `#DFFFEE` | high-emphasis text, sparkle particles |
| signal | `#FF6B4A` | reserved — locked/danger states only |

Fonts: JetBrains Mono / IBM Plex Mono for terminal & data text, Inter for body copy.

## Folder map

\`\`\`
blackroot/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts                    Mongo connection
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Session.ts               revocable refresh-token sessions
│   │   │   ├── ActivationCode.ts        shared, sysadmin-controlled signup code
│   │   │   ├── Channel.ts
│   │   │   ├── Entry.ts                 threads + nested replies
│   │   │   └── AuditLog.ts
│   │   ├── utils/
│   │   │   ├── roles.ts                 role hierarchy — single source of truth
│   │   │   ├── codeGenerator.ts         shared generator: recovery + activation codes
│   │   │   ├── tokens.ts                JWT sign/verify
│   │   │   └── asyncHandler.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts                  JWT verification from httpOnly cookie
│   │   │   ├── rbac.ts                  requireClearance / requireSysadmin
│   │   │   ├── rateLimit.ts
│   │   │   └── errorHandler.ts
│   │   ├── validators/
│   │   │   ├── authValidators.ts
│   │   │   └── entryValidators.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts        register, login, verify, password recovery
│   │   │   ├── channelController.ts
│   │   │   ├── entryController.ts       clearance-filtered queries live here
│   │   │   └── adminController.ts       users, channels, entries, activation, audit log
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── channelRoutes.ts
│   │   │   ├── entryRoutes.ts
│   │   │   └── adminRoutes.ts
│   │   ├── __tests__/
│   │   │   ├── setup.ts                 in-memory MongoDB for isolated tests
│   │   │   ├── roles.test.ts
│   │   │   └── access-control.test.ts   no-leak + privilege-escalation guarantees
│   │   ├── app.ts                       express app + middleware wiring
│   │   ├── server.ts                    entry point
│   │   └── seed.ts                      demo accounts, channels, storyline content
│   ├── .env.example
│   ├── jest.config.js
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.ts                 typed API surface (Role, Entry, Channel, SearchResult)
    │   ├── context/
    │   │   └── AuthContext.tsx           current-user state, login/register/verify/recovery
    │   ├── components/
    │   │   ├── TerminalLayout.tsx        authenticated app shell + responsive nav
    │   │   ├── RoleBadge.tsx
    │   │   ├── GlitchText.tsx
    │   │   ├── NetworkCanvas.tsx         animated particle-network background
    │   │   ├── FloatingReadouts.tsx
    │   │   ├── SparkleBurst.tsx
    │   │   ├── LockedEntryCard.tsx       redacted placeholder for gated content
    │   │   ├── HamburgerButton.tsx
    │   │   ├── PasswordStrengthMeter.tsx
    │   │   ├── RecoveryCodeReveal.tsx
    │   │   ├── AnimatedCounter.tsx
    │   │   ├── FAQAccordion.tsx
    │   │   └── RequireAuth.tsx           route guard (auth + minRole)
    │   ├── pages/
    │   │   ├── Landing.tsx               public marketing page
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── Verify.tsx                community rules + self-verification
    │   │   ├── ForgotPassword.tsx        recovery-code-based reset
    │   │   ├── Forum.tsx                 channel list (dashboard)
    │   │   ├── Channel.tsx               entries within a channel
    │   │   ├── Entry.tsx                 thread view, replies, flag, edit
    │   │   ├── SearchResults.tsx
    │   │   ├── Admin.tsx                 sysadmin console, 5 tabs
    │   │   └── NotFound.tsx
    │   ├── utils/
    │   │   └── roles.ts                  UI-only clearance helper (server re-enforces everything)
    │   ├── App.tsx                       route definitions
    │   ├── main.tsx                      React entry point
    │   └── index.css                     Tailwind + terminal effects (scanline, decrypt-reveal)
    ├── index.html
    ├── vercel.json                       SPA rewrite — required for direct nav/refresh
    ├── package.json
    ├── tailwind.config.ts
    └── vite.config.ts
\`\`\`


## Known gaps / where to extend next

- No pagination on entry or audit lists yet (fine at current scale, add `skip`/`limit` before real volume)
- No profile/settings page (the API returns join date and post count, but there's no UI to view your own)
- No WebSocket layer — replies require a refresh to see others' new posts
- No file/image uploads — entries are text-only
