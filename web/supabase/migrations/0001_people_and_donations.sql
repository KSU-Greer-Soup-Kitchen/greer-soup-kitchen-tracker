-- People and donations tables (FR-4, FR-5).
-- Run once in the Supabase SQL editor, or with the Supabase CLI.

-- One row per unique email. Every form and PayPal gift links back here.
create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  email text unique check (email = lower(email)),
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people (id) on delete set null,
  amount numeric(10, 2) not null check (amount > 0),
  currency text not null default 'USD',
  donated_at timestamptz not null,
  source text not null check (source in ('paypal', 'manual')),
  -- PayPal capture id. Unique, so a repeated webhook can never save a gift twice.
  paypal_txn_id text unique,
  paypal_event_id text,
  tribute_type text check (tribute_type in ('honor', 'memory')),
  tribute_name text,
  created_at timestamptz not null default now()
);

create index if not exists donations_person_id_idx on donations (person_id);
create index if not exists donations_donated_at_idx on donations (donated_at);

-- Row-level security on with no policies: the public cannot read or write anything.
-- Only the server (secret key) gets in. Staff policies come with staff login (FR-6).
alter table people enable row level security;
alter table donations enable row level security;

-- Saves one PayPal gift. Finds or creates the person by email, then adds the
-- donation unless that PayPal transaction is already saved.
-- Returns true if a new donation was added.
create or replace function record_paypal_donation(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_amount numeric,
  p_currency text,
  p_donated_at timestamptz,
  p_txn_id text,
  p_event_id text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := nullif(lower(trim(p_email)), '');
  v_person_id uuid;
  v_added integer;
begin
  if v_email is not null then
    insert into people (email, first_name, last_name)
    values (v_email, p_first_name, p_last_name)
    on conflict (email) do nothing;

    select id into v_person_id from people where email = v_email;
  end if;

  insert into donations (person_id, amount, currency, donated_at, source, paypal_txn_id, paypal_event_id)
  values (v_person_id, p_amount, p_currency, p_donated_at, 'paypal', p_txn_id, p_event_id)
  on conflict (paypal_txn_id) do nothing;

  get diagnostics v_added = row_count;
  return v_added > 0;
end;
$$;

revoke execute on function record_paypal_donation from public, anon, authenticated;
grant execute on function record_paypal_donation to service_role;
