# TMTODDS — setup guide

This build replaces the old localStorage-only prototype with a real
backend: Supabase (auth + database) and Paystack (payments), wired in
through Next.js Route Handlers. Follow these steps in order — nothing
will run until the first three are done.

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

1. Create a project at supabase.com (free tier is fine to start).
2. Go to the SQL Editor → New query, paste in the entire contents of
   `supabase/schema.sql`, and run it. This creates every table, the
   auto-profile trigger, and locked-down RLS policies.
3. Go to Project Settings → API and copy three values: the Project
   URL, the `anon` `public` key, and the `service_role` key (this last
   one is secret — never expose it to the browser).

## 3. Create a Paystack account

1. Register at paystack.com, and when asked for a business category
   pick **Gaming / Betting / Sports prediction** honestly rather than
   a generic category — Paystack explicitly supports this category,
   but registering as something else risks the account getting
   flagged later.
2. In Ghana specifically, betting-category accounts need a manual KYC
   review before card payments switch on — email support@paystack.com
   to start that; Mobile Money and USSD work from day one regardless.
3. Settings → API Keys & Webhooks → copy the **test** public and
   secret keys (`pk_test_...` / `sk_test_...`) to start. Switch to the
   live pair only once you've tested the full flow.
4. In the same Webhooks section, add an endpoint pointing at
   `https://<your-domain>/api/paystack/webhook`. This is what actually
   activates a subscriber's plan after a successful payment — the
   redirect back to `/vip/callback` is just for showing the person a
   confirmation, it doesn't grant access by itself.

## 4. Set your environment variables

```bash
cp .env.local.example .env.local
```

Fill in the Supabase and Paystack values from steps 2–3. Leave
`NEXT_PUBLIC_SITE_URL` as `http://localhost:3000` for local dev; set it
to your real domain once deployed (Paystack needs this to build the
redirect URL correctly).

## 5. Run it

```bash
npm run dev
```

Sign up for an account from the app itself (the same "Log in" button
as before, now backed by real Supabase Auth).

## 6. Make yourself admin

There's no self-serve "become admin" button on purpose — it's a
one-person operation right now. After signing up:

1. Supabase Dashboard → Table Editor → `profiles`.
2. Find your row, change `role` from `subscriber` to `admin`, save.
3. Reload the app — a small settings icon appears next to your name,
   linking to `/admin`, where you can post today's picks and settle
   yesterday's.

## 7. Deploy

The app lives in the `tmtodds` subfolder, not the repo root, so Vercel
needs to be told that explicitly — there's no `vercel.json` for this
(`rootDirectory` isn't a real `vercel.json` property, which is why you
may have seen a schema-validation error if one was set that way
before). Instead, after importing the repo:

1. Vercel Dashboard → your project → **Settings → Build and
   Deployment**.
2. Find **Root Directory**, set it to `tmtodds`, save.
3. **Settings → Environment Variables** — add every value from your
   `.env.local` here too. `.env.local` is git-ignored on purpose, so
   Vercel never sees those values unless you add them in the
   dashboard directly.
4. Redeploy. Vercel auto-detects Next.js once Root Directory is
   correct — no other config needed.

Once you have a real domain, update the Paystack webhook URL and
`NEXT_PUBLIC_SITE_URL` (as an env var in the dashboard) to match it.

## What's intentionally simple in this version

- **Chat is polling, not real-time.** Messages refresh every 6 seconds
  while the Chat tab is open, instead of a websocket/Realtime
  subscription. Fine for a first version; easy to upgrade later.
- **"Subscriptions" are one-time Mobile-Money-friendly charges**, not
  Paystack's native auto-recurring billing (which needs a card) — a
  successful payment sets an expiry timestamp, and the person pays
  again when it lapses. This matches how most Ghanaian fintech
  products handle it.
- **One admin.** Role changes happen by hand in the Supabase
  dashboard, not through a UI, since there's only ever one operator
  for now.
