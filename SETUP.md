# Setup guide

Two accounts are required before anything in this app actually works:
Supabase (auth + database) and Paystack (payments). Both have free
tiers that are enough to get started. This is the "payment link and
database system" that was intentionally left for you to fill in.

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (pick a
   region close to Ghana if given the choice — EU-West or similar).
2. **Project Settings → API** — copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this one
     secret — never expose it with a `NEXT_PUBLIC_` prefix, never
     commit it, never send it to the browser)
3. **SQL Editor → New query** — paste the entire contents of
   `supabase/schema.sql` and run it. This creates every table, the
   `handle_new_user` trigger that turns a signup into a `profiles`
   row, and locks every table down with row-level security.
4. **Authentication → Providers** — email/password is enabled by
   default, which is all this app uses. If you'd rather skip email
   confirmation while testing, turn off "Confirm email" under
   **Authentication → Settings**.
5. To make yourself an admin (so `/admin` isn't a 404 for everyone):
   sign up once through the running app, then in the SQL Editor run
   `update profiles set role = 'admin' where email = 'you@example.com';`

## 2. Paystack

1. Create an account at [paystack.com](https://paystack.com). Ghana
   accounts (Mobile Money + card) go through a manual KYC review before
   you can accept live payments — expect that to take a few days, and
   start it early. **Settings → API Keys & Webhooks** works immediately
   in test mode while that's pending.
2. Copy the test keys into `.env.local`:
   - `Public Key` → `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - `Secret Key` → `PAYSTACK_SECRET_KEY`
3. **Settings → API Keys & Webhooks → Webhook URL** — set this to
   `https://your-domain.com/api/paystack/webhook` once deployed. This
   is what actually activates a plan after payment (the redirect back
   to `/vip/callback` also double-checks and activates it immediately,
   so someone doesn't have to wait on the webhook to see their access
   unlock — but the webhook is the reliable path if they close the tab
   before the redirect fires).
4. Test payments: Paystack's test cards and test Mobile Money numbers
   are listed in their docs; nothing here depends on which one you use.
5. When you're ready to accept real money, switch `.env.local` to the
   live key pair and repeat step 3 with your live webhook URL.

## 3. Running locally

```bash
npm install
cp .env.local.example .env.local   # fill in everything from steps 1-2
npm run dev
```

Visit `http://localhost:3000`. Sign up, make yourself admin (step 5
above), then visit `/admin` to post today's first pick.

## 4. Deploying

Any host that runs Next.js works. On Vercel: import the repo, add the
same variables from `.env.local` in **Project Settings → Environment
Variables**, and set `NEXT_PUBLIC_SITE_URL` to your real domain (this
is used to build the Paystack redirect URL — if it's wrong, checkout
will send people back to the wrong place). Redeploy after adding a
webhook URL that points at the deployed domain.

## What's intentionally simple in this first version

- **Chat is polling, not realtime.** The lounge re-fetches every 6
  seconds while it's open rather than using Supabase Realtime. Fine
  for a first version's traffic; swap in a Realtime subscription in
  `AppProvider.tsx` if the lounge gets busy enough that 6 seconds feels
  slow.
- **One Mobile Money/card charge per plan, not auto-renewing.**
  `plan_expires_at` just gets checked against the current time; there's
  no recurring billing. Renewing means going through checkout again.
- **A pinned message and an attached pick are both single-slot per
  message** — a message can be pinned (unpinning whatever was pinned
  before it in that channel) and/or reference one pick, not a list of
  either. Matches what the design calls for; extend
  `chat_messages`/`src/app/api/chat/route.ts` if that needs to grow.
