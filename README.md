# BLACKROOT

A MERN forum with real, server-enforced role-based access control across four
clearance tiers — **guest → verified → operative → sysadmin**. Dark jade/emerald
terminal aesthetic; unlocking gated content triggers a decrypt-reveal animation.

I couldn't run a live server or `npm install` in the sandbox that built this
(no outbound network access there), so treat this as reviewed, hand-written
code rather than a build I've verified compiles byte-for-byte — walk through
`npm install` locally and ping me with any error and I'll fix it fast.

## Stack

- **Backend:** Node, Express, TypeScript, MongoDB/Mongoose, JWT (httpOnly
  cookies), bcrypt, Zod validation, express-rate-limit, Helmet, Jest + Supertest
- **Frontend:** React 18, TypeScript, Vite, React Router, Tailwind CSS, Framer Motion

## Why access control actually holds up

The single most important design decision: **clearance filtering happens in
the database query, not after the fetch.** `entryController.clearanceFilter()`
builds a Mongo `$in` clause from the requester's role and passes it directly
into `Entry.find()`. A guest's request for a channel's entries never even
retrieves operative-only rows from MongoDB — there's no code path where
restricted content sits in memory on the server and gets filtered before the
response goes out. Fetch-then-filter is the classic way these systems leak;
this avoids that shape entirely.

Direct-by-ID entry fetches (`GET /api/entries/:entryId`) go through a second
gate: if the requester's clearance doesn't meet the entry's, the response is
a redacted placeholder (`{ locked: true, requiredClearance }`) — no title,
body, author, or replies serialize into JSON at all.

Everything is re-checked server-side on every request via `authenticate` +
`requireClearance`/`requireSysadmin` middleware. The frontend's `meetsClearance`
helper (`frontend/src/utils/roles.ts`) is explicitly documented as UI-only —
it decides what to *show a nav link for*, never what data gets fetched.

Other things worth knowing about:
- Sessions are server-side revocable (`Session` model + `jti`), so logout and
  admin "revoke sessions" actually invalidate — not just clearing client cookies.
- Account lockout after 5 failed logins (15 min), generic error message so
  login doesn't confirm which emails are registered.
- Every admin action (role change, clearance change, purge, session revoke)
  writes to `AuditLog`.
- A role can never be changed by any path except the sysadmin-gated
  `PATCH /admin/users/:id/role` route — role is always read from the verified
  JWT (`req.user`), never trusted from a request body.
- Unauthorized access to admin routes returns `404`, not `403`, so an
  unprivileged account can't even confirm the console exists.

## Password reset & account activation — no email/SMS provider needed

This deployment has no outbound email or SMS service, so two things work differently than a typical app:

- **Password reset** uses a one-time **recovery code** instead of an emailed link — functionally identical to
  2FA backup codes. It's generated at registration, shown to the user exactly once (`RecoveryCodeReveal`
  component), and only its bcrypt hash is ever stored. `POST /api/auth/forgot-password` takes email + recovery
  code + new password, resets the password, revokes every existing session, and issues a fresh rotated code.
  If a user loses their code entirely, only a Sysadmin can restore access (same failure mode as losing 2FA
  backup codes anywhere else).
- **Account activation** is instant and automatic (`activatedAt` set at creation) rather than gated behind an
  emailed activation link. Guest is already the network's most-restricted tier, so an email gate in front of it
  would only add operational overhead (someone manually generating and delivering links) without changing what
  an "unactivated" account could do differently.

## Search, flagging, editing, and full admin management

- `GET /api/entries/search` is wired to a real search bar (desktop nav + mobile drawer) and results page —
  clearance-filtered at the database layer like everything else.
- Any Verified+ account can flag an entry for review from the Entry view.
- Entry authors (and Sysadmins) can edit their own entries inline.
- The admin console now has full **Channels** and **Entries** tabs — create/edit channel clearance requirements,
  lock/archive channels, reassign an entry's clearance, lock or purge entries — in addition to the existing
  Users, Activation Code, and Audit Log tabs.

## Public site & the verification flow

- `/` is now a full public landing page — hero, clearance tier breakdown, the
  escalation path explained step by step, a features section, testimonials,
  a rules preview, and an FAQ. No login required to view it.
- `/verify` hosts the complete Community Rules document plus the one and
  only self-service role change in the system: a logged-in Guest account
  can check "I agree" and be upgraded to Verified immediately
  (`POST /api/auth/verify`, guest-only, writes to the audit log).
- The authenticated app (channels, entries, admin console) now lives under
  `/dashboard` instead of `/`.

## Getting it running

### 1. MongoDB
Use a local install or a free Atlas cluster. You just need a connection string.

### 2. Backend
```bash
cd backend
cp .env.example .env      # fill in MONGO_URI and generate two long random JWT secrets
npm install
npm run seed               # creates one demo account per role + sample channels
npm run dev                 # http://localhost:4000
```
Demo accounts (all use password `NeonBreach#2026`):
| Role | Email |
|---|---|
| guest | guest@blackroot.dev |
| verified | verified@blackroot.dev |
| operative | operative@blackroot.dev |
| sysadmin | sysadmin@blackroot.dev |

The seeded network activation code is `BLACKROOT-JOIN` — unlike a one-time invite code, this one is
reusable: any number of new signups can use the same code until a Sysadmin regenerates it from the
admin console's Activation Code tab. Set `REQUIRE_INVITE_CODE=false` in `.env` to skip the requirement
entirely and allow open registration.

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
Covers: role hierarchy logic, login lockout, redacted-placeholder behavior,
no-leak guarantee on channel listings, admin-route blocking, and
privilege-escalation resistance.

## Folder map

```
backend/src/
  utils/roles.ts          role hierarchy — single source of truth
  middleware/auth.ts       JWT verification from httpOnly cookie
  middleware/rbac.ts       requireClearance / requireSysadmin / ownership check
  controllers/entryController.ts   the query-layer clearance filter lives here
  controllers/adminController.ts   role changes, audit logging, session revoke
  __tests__/               Jest + Supertest, in-memory MongoDB

frontend/src/
  api/client.ts            typed API surface + Role/Entry/Channel types
  context/AuthContext.tsx  current-user state, login/register/logout
  components/              RoleBadge, GlitchText, SparkleBurst, LockedEntryCard
  pages/                   Login, Register, Forum, Channel, Entry, Admin, 404
```

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

## Known gaps / where to extend next

- No file/image uploads — entries are text-only.
- No email verification step on registration (the shared activation code plus instant self-activation stand in for it — see the password reset & activation section above).
- No pagination on entry/audit lists yet (fine at demo scale, add `skip/limit`
  before this holds real volume).
- No WebSocket layer — replies require a refresh to see others' new posts.
