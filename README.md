# TMTODDS

A sports-picks subscription app for Ghana: a free daily pick, a paid
board of analysis across a few tiers, a results ledger with pending
picks tracked openly, and a members' lounge — built with Next.js (App
Router), Supabase (auth + Postgres), and Paystack (payments).

Responsive from a phone up to a desktop sidebar layout — not just the
mobile view stretched wide.

## Stack

- **Next.js 16 / React 19 / TypeScript**, Tailwind v4 for styling
- **Supabase** — auth, Postgres, row-level security (`supabase/schema.sql`)
- **Paystack** — checkout + webhook-driven plan activation
- Route Handlers under `src/app/api/*` are the only thing that talk to
  the database directly (via the service-role key) or to Paystack; the
  browser only ever calls these routes, never Supabase or Paystack
  straight from the client for anything sensitive.

## Getting started

See **[SETUP.md](./SETUP.md)** — nothing runs until you've created a
Supabase project, run the schema, and added a Paystack account. That
file walks through both, plus deploying.

```bash
npm install
cp .env.local.example .env.local   # fill in the values from SETUP.md
npm run dev
```

## Project layout

```
src/app/             Root layout + the shell page (composes the tab
                     components below), tab-switched client-side.
                     Below `lg` it's the mobile phone-shell; at `lg`
                     and up, Sidebar.tsx takes over navigation
src/app/auth/        Password-reset landing page (the link Supabase's
                     reset email points to)
src/app/legal/       Terms, Privacy, Responsible Gambling -- draft
                     templates, clearly marked as not-yet-lawyer-reviewed
src/components/      Home / Slips / Proof / VIP / Chat tab components,
                     the desktop Sidebar, the auth modal, bottom nav
                     (mobile), and shared pick/ledger/chat-bubble UI
src/app/admin/       Posting and settling picks, admin-only, gated
                     server-side in admin/layout.tsx
src/app/api/         Route Handlers: picks, chat (incl. moderation),
                     Paystack
src/app/store/       React context + provider wiring the UI to /api
src/lib/             Supabase clients, plan definitions, Paystack
                     helpers, shared types, date formatting
supabase/schema.sql  Full DB schema + RLS policies
```

## Beyond the core picks/payments flow

- **Desktop layout**: `Sidebar.tsx` replaces the bottom nav at `lg`
  widths; Home, Slips, Proof, and VIP reflow into multi-column layouts
  instead of just centering the mobile view in empty space.
- **Password reset**: "Forgot password?" in the login modal calls
  Supabase's `resetPasswordForEmail`; the email link lands on
  `/auth/reset-password`, which listens for the `PASSWORD_RECOVERY`
  auth event before letting someone set a new password.
- **Chat moderation**: admins get a delete control on every message
  (hover on desktop, always visible on mobile) via
  `DELETE /api/chat/[id]`.
- **Accessibility pass**: icon-only buttons (send, pin, settle,
  nav items, delete) have `aria-label`s; nav/filter/channel buttons
  expose `aria-current`/`aria-pressed` for screen readers.
- **Rate limiting**: a Postgres-backed sliding-window limiter
  (`src/lib/rateLimit.ts`, `check_rate_limit()` in schema.sql) throttles
  chat posting and checkout-initiation — no extra service to sign up
  for. Signup/login abuse protection is Supabase's own (see SETUP.md).
- **Analytics**: Google Analytics, gated behind an explicit
  accept/decline consent banner (`src/components/Analytics.tsx`) —
  entirely optional, controlled by one env var.
- **Live scores**: an optional "LIVE 63' · 1-0" badge on today's board
  once a pick's match kicks off, sourced from api-football
  (`src/lib/liveScores.ts`, `src/lib/useLiveScores.ts`,
  `/api/live-scores`). Purely informational — it never settles a pick;
  Won/Lost/Void in `/admin` still does that by hand.
- **Proof photos**: bet-slip screenshots (multiple per pick) uploaded
  in `/admin` after settling, stored in a public Supabase Storage
  bucket and shown as a tap-to-enlarge thumbnail strip on that pick's
  row in the Proof tab — visual backing for the win rate, grouped
  implicitly by the ledger's existing Won/Lost/Pending filter.
- **Dashboard-controlled plans**: price, duration, and a hide/show
  toggle per plan, editable in `/admin` with no deploy (`plan_prices`
  table) — display, charge, and activation length all read the same
  merged values.
- **Admin-created members**: accounts for customers without email
  (username + password; a placeholder address under the hood), with an
  optional plan assigned at creation for cash/direct-MoMo sales, plus
  a member list with plan management and password resets.
- **SEO + PWA**: a dynamic sitemap, a brand-matched Open Graph share
  image generated at request time, and a web manifest with proper
  icons so the app can be added to a phone's home screen.
- **Tests**: `npm test` runs a focused Vitest suite over the two
  places a bug would be most costly — tier-locking (`plans.test.ts`)
  and Paystack webhook signature verification (`paystack.test.ts`).

## A note on honesty in the product copy

Picks are labeled as analysis/predictions, not as guaranteed outcomes,
and every stat shown in the app (win rate, streak, picks posted) is
computed live from the `picks` table rather than hardcoded — there's
nothing to keep in sync by hand, and nothing shown to a subscriber is
invented.

This is also why the paid tiers are branded **"Locked"** rather than
"Fixed": in this market "fixed match" specifically implies a
pre-arranged result, which is both untrue of an analysis product and
the exact language used by match-fixing scam channels. "Locked" keeps
the same confident, vault-like feel — it pairs with the padlock/unlock
iconography used throughout the board and ledger — without making that
claim. If you change tier names or chat copy later, keep this in mind;
`src/lib/plans.ts` has the longer version of this note.

## Payments and database are not wired to live credentials

This build ships with the full Supabase + Paystack integration code
(schema, RLS, Route Handlers, webhook signature verification), but
`.env.local.example` only has placeholder values — see SETUP.md to
create your own Supabase project and Paystack account and plug in the
real keys. Until then, `npm run dev` will start, but sign-up, checkout,
and anything reading/writing the database will fail.
