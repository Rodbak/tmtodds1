-- TMTODDS database schema
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run: every statement is guarded with "if not exists" / "or replace".

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('subscriber', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type plan_id as enum ('weekly', 'pro', 'elite', 'correct_score');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pick_tier as enum ('free', 'weekly', 'pro', 'elite', 'correct_score');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pick_status as enum ('pending', 'won', 'lost', 'void');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'success', 'failed');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- profiles — one row per auth user. Created automatically by the
-- trigger below whenever someone signs up.
-- ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role user_role not null default 'subscriber',
  plan plan_id,
  plan_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- picks — today's board AND the settled-results ledger are the
-- same table, just filtered by status. This is the single source
-- of truth the win-rate/streak stats get computed from, so there
-- is nothing to fabricate: the number is just a query.
-- ─────────────────────────────────────────────────────────────
create table if not exists picks (
  id uuid primary key default gen_random_uuid(),
  league text not null,
  fixture text not null,
  market text not null,
  odds numeric(6, 2) not null,
  kickoff_at timestamptz not null,
  tier pick_tier not null default 'free',
  status pick_status not null default 'pending',
  result_note text,
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  -- Fixture id from the live-scores provider (api-football/api-sports.io),
  -- entered by admin when posting a pick. Optional: a pick with no id
  -- just never shows a live badge. See src/lib/liveScores.ts.
  external_fixture_id text
);

alter table picks add column if not exists external_fixture_id text;

create index if not exists picks_kickoff_idx on picks (kickoff_at desc);
create index if not exists picks_status_idx on picks (status);

-- ─────────────────────────────────────────────────────────────
-- pick_proofs — bet-slip screenshots attached to a pick (usually at
-- settle time) so the Proof tab's win/lose ledger can show visual
-- evidence, not just a status label. Storage bucket below holds the
-- actual image bytes; this table just points at them.
-- ─────────────────────────────────────────────────────────────
create table if not exists pick_proofs (
  id uuid primary key default gen_random_uuid(),
  pick_id uuid not null references picks (id) on delete cascade,
  image_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists pick_proofs_pick_idx on pick_proofs (pick_id);

alter table pick_proofs enable row level security;

drop policy if exists "no direct pick_proofs access" on pick_proofs;
create policy "no direct pick_proofs access" on pick_proofs
  for select using (false);
  -- Reads go through /api/picks (ledger scope), which resolves
  -- image_path to a public storage URL; writes go through
  -- /api/picks/[id]/proofs using the service role.

-- Public bucket: proof screenshots are meant to be shown to
-- prospective subscribers as evidence of the win rate, so there's no
-- reason to gate reads behind a signed URL. Only Route Handlers using
-- the service role key can upload/delete (no anon insert policy).
insert into storage.buckets (id, name, public)
values ('proof-images', 'proof-images', true)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- chat_messages — the VIP lounge. Starts empty; nothing here is
-- ever seeded, so every message a subscriber sees came from a real
-- person. is_pinned lets admin surface one message as a banner at
-- the top of a channel; attached_pick_id lets a message embed a
-- live pick card (tier-gated the same way the board is).
-- ─────────────────────────────────────────────────────────────
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles (id) on delete set null,
  author_name text not null,
  is_admin boolean not null default false,
  is_pinned boolean not null default false,
  attached_pick_id uuid references picks (id) on delete set null,
  channel text not null default 'general',
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_channel_idx on chat_messages (channel, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- payments — an audit trail of every Paystack transaction. The
-- webhook is the only writer; it's what actually grants a plan.
-- ─────────────────────────────────────────────────────────────
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete cascade,
  plan plan_id not null,
  amount_pesewas integer not null,
  reference text unique not null,
  status payment_status not null default 'pending',
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- rate_limits — a minimal sliding-window counter so chat posting
-- and checkout-initiation can't be scripted/flooded. Deliberately
-- simple (one row per key, reset when the window elapses) rather
-- than a full token-bucket implementation -- good enough for a
-- launch, swap in Vercel's Firewall or Upstash if traffic grows
-- past what a single Postgres row can arbitrate cleanly.
-- ─────────────────────────────────────────────────────────────
create table if not exists rate_limits (
  key text primary key,
  count int not null default 1,
  window_start timestamptz not null default now()
);

create or replace function check_rate_limit(p_key text, p_max_requests int, p_window_seconds int)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_count int;
begin
  insert into rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
          when rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
            then 1
          else rate_limits.count + 1
        end,
        window_start = case
          when rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
            then now()
          else rate_limits.window_start
        end
  returning count into v_count;

  return v_count <= p_max_requests;
end;
$$;

alter table rate_limits enable row level security;

drop policy if exists "no direct rate_limits access" on rate_limits;
create policy "no direct rate_limits access" on rate_limits
  for select using (false);
  -- Only touched via the check_rate_limit() function (security
  -- definer) called from Route Handlers using the service role.

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
--
-- The app's Route Handlers use the Supabase *service role* key to
-- do the actual reads/writes (tier-gating, admin checks, and
-- Paystack webhook handling all happen in application code, not in
-- Postgres policies). RLS here is a deliberately strict safety net:
-- it assumes direct table access from the browser's anon key and
-- only allows the minimum a signed-in user needs.
-- ─────────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table picks enable row level security;
alter table chat_messages enable row level security;
alter table payments enable row level security;

drop policy if exists "read own profile" on profiles;
create policy "read own profile" on profiles
  for select using (auth.uid() = id);

-- No self-service "edit my profile" policy yet, because no such
-- feature exists in the app — profiles are only ever written by the
-- signup trigger above or by Route Handlers using the service role
-- (Paystack activation, admin actions). If you add a "change my
-- name" feature later, give it its own policy that explicitly
-- excludes role/plan/plan_expires_at from what a user can set,
-- rather than reusing a broad "update own row" policy — otherwise
-- it's easy to accidentally let someone grant themselves admin or a
-- free plan.

drop policy if exists "no direct picks access" on picks;
create policy "no direct picks access" on picks
  for select using (false);
  -- All pick reads go through /api/picks so free/locked tiers are
  -- masked correctly. Nothing reads this table with the anon key.

drop policy if exists "no direct chat access" on chat_messages;
create policy "no direct chat access" on chat_messages
  for select using (false);
  -- Reads/writes go through /api/chat, which checks the sender's
  -- plan against the channel before allowing it.

drop policy if exists "no direct payments access" on payments;
create policy "no direct payments access" on payments
  for select using (false);
  -- Payments are never read by the client directly; the webhook and
  -- the verify route are the only things that touch this table.
