# TMTODDS

A sports-picks subscription app for Ghana: a free daily pick, a paid
board of analysis across a few tiers, a results ledger, and a members'
lounge — built with Next.js (App Router), Supabase (auth + Postgres),
and Paystack (payments).

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
file walks through both, plus deploying to Vercel.

```bash
npm install
cp .env.local.example .env.local   # fill in the values from SETUP.md
npm run dev
```

## Project layout

```
src/app/            Pages (App Router) — page.tsx is the whole
                     mobile-shell UI, tab-switched client-side
src/app/admin/       Posting and settling picks (admin-only, gated
                     server-side in admin/layout.tsx)
src/app/api/         Route Handlers: picks, chat, Paystack
src/app/store/       React context + provider wiring the UI to /api
src/lib/             Supabase clients, plan definitions, Paystack
                     helpers, shared types
supabase/schema.sql  Full DB schema + RLS policies
```

## A note on honesty in the product copy

Picks are labeled as analysis/predictions, not as "fixed" or
guaranteed outcomes, and every stat shown in the app (win rate, streak,
picks posted) is computed live from the `picks` table rather than
hardcoded — there's nothing to keep in sync by hand, and nothing shown
to a subscriber is invented.
