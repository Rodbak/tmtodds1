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
6. **Configure custom SMTP before launch — this one is easy to miss.**
   Supabase's built-in email sender (used for signup confirmation and
   the "Forgot password?" flow) is capped at **2 messages per hour for
   the entire project**, and by default refuses to deliver to any
   address that isn't already a member of your Supabase organization.
   In practice: without this step, password reset and signup
   confirmation emails will not reach real subscribers at all, not
   just slowly. Go to **Authentication → Emails → SMTP Settings**, add
   credentials from a provider (Resend, Postmark, SendGrid, and AWS SES
   all work — Resend has the most direct Supabase integration at the
   time of writing), and the cap moves to 30/hour, adjustable further
   under **Authentication → Rate Limits**.
7. **Turn on signup/login abuse protection.** This app's own rate
   limiting (see below) covers chat and checkout, but signup and login
   go straight to Supabase Auth, so their abuse protection lives in
   the dashboard instead: set stricter values under **Authentication →
   Rate Limits**, and turn on CAPTCHA (hCaptcha or Cloudflare Turnstile)
   under **Authentication → Attack Protection** if you want a bot
   deterrent on the signup form itself.
8. **Already ran `schema.sql` on an earlier version of this codebase?**
   Re-run it after pulling new code — every statement is guarded with
   `if not exists` / `on conflict do nothing`, so it only adds what's
   new (over time that has included `picks.external_fixture_id`, the
   `pick_proofs` table, the `proof-images` Storage bucket, the
   `plan_prices` overrides table with its duration/visibility columns,
   and the `live_score_cache` table). Nothing existing gets touched.

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

## 3. Live scores (optional)

Picks on the board and the Slips tab can show a small "LIVE 63' · 1-0"
badge once a match kicks off, sourced from
[api-football](https://www.api-football.com/) (also branded
api-sports.io) — its direct API has a free tier (~100 requests/day)
that's plenty for a handful of daily picks.

1. Create a free account at
   [dashboard.api-football.com](https://dashboard.api-football.com/register)
   and copy your API key from the dashboard home page.
2. Set `SPORTS_API_KEY` in `.env.local`. Leave it blank to run without
   live scores at all — picks just never show the badge, nothing else
   depends on it.
3. When posting a pick in `/admin`, fill in the optional **External
   fixture ID** field with that match's fixture id from api-football
   (searchable on their site/dashboard by team names and date, or via
   their `/fixtures` endpoint). A pick with no id posted just won't
   show a live badge — everything else about it works the same.
4. This only ever adds an informational badge (score, match clock,
   HT/FT/postponed). It never settles a pick automatically — Won /
   Lost / Void in `/admin` is still the only thing that decides a
   pick's outcome, on purpose (a stray postponement or an ambiguous
   market like "Over 1.5" shouldn't get auto-graded).
5. Bet-slip proof photos are a separate, unrelated feature — see
   "Proof photos" below; they don't need this API key at all.

## 4. Proof photos

Every settled pick in the admin panel's "Recently settled" list has an
upload control for bet-slip screenshots (multiple per pick). They're
stored in the `proof-images` Supabase Storage bucket that
`schema.sql` creates, and show up as a thumbnail strip (tap to
enlarge) on that pick's row in the Proof tab's ledger — already
grouped implicitly by the Won/Lost/Pending filter that tab has had
from the start, since a proof photo is just attached to an
already-classified pick. Nothing to configure here beyond having run
`schema.sql`; uploads go through `/api/picks/[id]/proofs` using the
service-role key, same as every other admin write in this app.

## 5. Plan settings and admin-created members

Both of these live in the `/admin` dashboard and need no code deploy:

- **Plan settings** — each plan's price (changes weekly? just edit and
  save), its duration in days, and a Hide/Show toggle that takes a
  plan off the VIP tab (and blocks checkout for it) without deleting
  anything. The VIP tab display, the amount Paystack charges, and how
  long an activated plan lasts all read the same saved values, so they
  can't drift apart.
- **Members** — create an account for a customer who has no email
  address: name + username + starting password, optionally assigning
  a paid plan at the same time (for cash / direct Mobile Money sales
  — these get a `manual_...` row in the payments audit trail). The
  member logs in by typing their **username** in the normal login box.
  Under the hood, Supabase stores a synthetic address on the
  placeholder domain `member.tmtodds.app` — nothing is ever emailed to
  it, and the member never sees it. Because these accounts have no
  real email, their **password resets happen in the member list**, not
  through the "Forgot password?" flow.

## 6. Google Analytics (optional)

1. Create a GA4 property at [analytics.google.com](https://analytics.google.com), add a web data stream for your
   domain, and copy the **Measurement ID** (starts with `G-`).
2. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env.local`. Leave it blank to run with no analytics at all — nothing
   else in the app depends on it.
3. That's it — the app only loads the Google Analytics script after a visitor clicks "Accept" on the consent
   banner shown on their first visit (see `src/components/Analytics.tsx`); "Decline" means it never loads for
   them. This is already reflected in the Privacy Policy draft.

## 7. Running locally

```bash
npm install
cp .env.local.example .env.local   # fill in everything from steps 1-2
npm run dev
```

Visit `http://localhost:3000`. Sign up, make yourself admin (step 5
above), then visit `/admin` to post today's first pick.

## 8. Deploying

Any host that runs Next.js works. On Vercel, there are two ways
Supabase ends up connected to the project — what matters is that every
variable below actually lands in **Project Settings → Environment
Variables**, however it gets there:

**If you installed Supabase through Vercel's Integration/Marketplace
tab** (Vercel dashboard → your project → **Storage** tab → the
Supabase entry, or **Integrations** tab depending on Vercel's current
layout): the integration only auto-syncs the Supabase-specific
variables — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
and usually `SUPABASE_SERVICE_ROLE_KEY`. Check **Project Settings →
Environment Variables** to confirm all three actually appear (the
service role key is the one most often missed, since some integration
versions only push the anon key) — if it's missing, copy it in
manually from Supabase's **Project Settings → API**. Everything else
this app needs — `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`,
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `SPORTS_API_KEY`
— is never something the integration knows about, so add those by hand
the same way.

**If you just created both projects separately with no integration**:
add every variable from `.env.local` by hand in **Project Settings →
Environment Variables** — nothing syncs automatically.

Either way:
1. Set `NEXT_PUBLIC_SITE_URL` to your real domain (used to build the
   Paystack redirect URL, the sitemap, and the Open Graph share image —
   if it's wrong, all three point at the wrong place).
2. Redeploy after adding these (env var changes need a redeploy to take
   effect on Vercel).
3. Add the Paystack webhook URL pointing at the deployed domain (see
   step 2.3 above) and redeploy again.
4. Confirm `supabase/schema.sql` has actually been run against this
   project's database (SQL Editor → paste → run) — the integration
   only wires up the *connection*, it doesn't create any tables.

## 9. Before you actually launch

A few things ship as drafts on purpose and need your input before real
users see them:

- **`src/app/legal/terms`, `/privacy`, `/responsible-gambling`** — read
  every `[bracketed placeholder]` in these three pages. In particular,
  `/legal/responsible-gambling` deliberately does **not** include a
  support helpline number — we couldn't verify one is still current, and
  a wrong number there is worse than none. Check
  [gamingcommission.gov.gh](https://gamingcommission.gov.gh) and
  [mha-ghana.com](https://mha-ghana.com) for what's currently correct
  and add it before this page goes live.
- **Register as a data controller** with Ghana's Data Protection
  Commission ([dataprotection.org.gh](https://dataprotection.org.gh))
  before launch — required under the Data Protection Act, 2012 (Act
  843), not optional paperwork.
- **Have a lawyer look at all three legal pages** against your actual
  business setup (refund policy, company name/address, liability
  language) — they're a solid starting structure, not a substitute for
  review.
- **Run `npm test`** — covers the tier-locking and payment-webhook
  logic. Should already be passing; re-run after any change to
  `src/lib/plans.ts` or `src/lib/paystack.ts` specifically, since
  those are what the tests are watching.

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
- **Rate limiting covers chat and checkout**, not signup/login —
  those still rely on Supabase's own dashboard rate limits
  (**Authentication → Rate Limits**) and, optionally, CAPTCHA
  (**Authentication → Attack Protection**). Turn both on before
  launch; nothing in this codebase throttles them otherwise.
- **Tests cover the money/access-control logic only**
  (`npm test`) — tier-locking (`plans.test.ts`) and webhook signature
  verification (`paystack.test.ts`), the two places a bug would either
  leak paid content or mis-activate a payment. UI and API-route
  integration tests aren't included; add them as this grows past the
  first version.
- **Live scores never auto-settle a pick.** The badge is purely
  informational (score, clock, HT/FT/postponed); Won/Lost/Void in
  `/admin` is still the only thing that decides an outcome. Matching a
  pick to a live fixture is also manual — admin pastes in the
  api-football fixture id when posting the pick, rather than the app
  guessing it from the free-text fixture name.
- **Proof photos have no moderation/cropping/compression pipeline** —
  whatever the admin uploads (up to 5MB, image files only) is what
  gets stored and shown, as-is.
