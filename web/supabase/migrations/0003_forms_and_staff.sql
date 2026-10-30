-- Volunteers, donors, help requests, and volunteer hours (FR-1, FR-2, FR-3, FR-5, FR-7, FR-8).
-- Run once in the Supabase SQL editor, after 0002.

-- Contact details every form shares live on the person, so records link by email (FR-5)
alter table people
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists age_group text,
  add column if not exists updated_at timestamptz not null default now();

-- Staff can add a short note to any gift (e.g. check number)
alter table donations add column if not exists notes text;

create table if not exists volunteers (
  person_id uuid primary key references people (id) on delete cascade,
  availability text[] not null default '{}',
  skills text[] not null default '{}',
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per shift worked. Feeds the volunteer hours report.
create table if not exists volunteer_shifts (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people (id) on delete cascade,
  shift_date date not null,
  hours numeric(5, 2) not null check (hours > 0 and hours <= 24),
  task text,
  created_at timestamptz not null default now()
);
create index if not exists volunteer_shifts_person_id_idx on volunteer_shifts (person_id);
create index if not exists volunteer_shifts_shift_date_idx on volunteer_shifts (shift_date);

create table if not exists donors (
  person_id uuid primary key references people (id) on delete cascade,
  giving_frequency text check (giving_frequency in ('one-time', 'recurring')),
  heard_from text,
  contact_prefs text[] not null default '{}',
  newsletter boolean,
  tribute_type text check (tribute_type in ('honor', 'memory')),
  tribute_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assistance_requests (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people (id) on delete cascade,
  need text not null,
  details text,
  best_time text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  staff_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assistance_requests_person_id_idx on assistance_requests (person_id);
create index if not exists assistance_requests_status_idx on assistance_requests (status);

-- Same as people and donations: no policies, so only the server (secret key) gets in.
-- The server checks for a logged-in staff member before it reads anything (FR-6, NFR-2).
alter table volunteers enable row level security;
alter table volunteer_shifts enable row level security;
alter table donors enable row level security;
alter table assistance_requests enable row level security;

-- Finds the person with this email, or adds them. Returns their id.
-- A person with no email (e.g. a help request with only a phone) always gets a new row.
-- New details replace old ones; blank answers keep what we already have.
create or replace function upsert_person(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_address text,
  p_city text,
  p_age_group text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := nullif(lower(trim(p_email)), '');
  v_id uuid;
begin
  insert into people (email, first_name, last_name, phone, address, city, age_group)
  values (v_email, nullif(trim(p_first_name), ''), nullif(trim(p_last_name), ''), nullif(trim(p_phone), ''),
          nullif(trim(p_address), ''), nullif(trim(p_city), ''), nullif(trim(p_age_group), ''))
  on conflict (email) do update set
    first_name = coalesce(excluded.first_name, people.first_name),
    last_name = coalesce(excluded.last_name, people.last_name),
    phone = coalesce(excluded.phone, people.phone),
    address = coalesce(excluded.address, people.address),
    city = coalesce(excluded.city, people.city),
    age_group = coalesce(excluded.age_group, people.age_group),
    updated_at = now()
  returning id into v_id;
  return v_id;
end;
$$;

-- Volunteer sign-up form (FR-1). Signing up again updates the same volunteer.
create or replace function submit_volunteer(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_address text,
  p_age_group text,
  p_availability text[],
  p_skills text[],
  p_notes text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person_id uuid := upsert_person(p_email, p_first_name, p_last_name, p_phone, p_address, null, p_age_group);
begin
  insert into volunteers (person_id, availability, skills, notes)
  values (v_person_id, coalesce(p_availability, '{}'), coalesce(p_skills, '{}'), nullif(trim(p_notes), ''))
  on conflict (person_id) do update set
    availability = excluded.availability,
    skills = excluded.skills,
    notes = coalesce(excluded.notes, volunteers.notes),
    active = true,
    updated_at = now();
  return v_person_id;
end;
$$;

-- Donor form (FR-2). Sending it again updates the same donor.
create or replace function submit_donor(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_address text,
  p_city text,
  p_age_group text,
  p_giving_frequency text,
  p_heard_from text,
  p_contact_prefs text[],
  p_newsletter boolean,
  p_tribute_type text,
  p_tribute_name text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person_id uuid := upsert_person(p_email, p_first_name, p_last_name, p_phone, p_address, p_city, p_age_group);
begin
  insert into donors (person_id, giving_frequency, heard_from, contact_prefs, newsletter, tribute_type, tribute_name)
  values (v_person_id, p_giving_frequency, nullif(trim(p_heard_from), ''), coalesce(p_contact_prefs, '{}'),
          p_newsletter, p_tribute_type, nullif(trim(p_tribute_name), ''))
  on conflict (person_id) do update set
    giving_frequency = excluded.giving_frequency,
    heard_from = coalesce(excluded.heard_from, donors.heard_from),
    contact_prefs = excluded.contact_prefs,
    newsletter = coalesce(excluded.newsletter, donors.newsletter),
    tribute_type = excluded.tribute_type,
    tribute_name = excluded.tribute_name,
    updated_at = now();
  return v_person_id;
end;
$$;

-- Help request form (FR-3). Every request is a new row.
create or replace function submit_assistance_request(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_need text,
  p_details text,
  p_best_time text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person_id uuid := upsert_person(p_email, p_first_name, p_last_name, p_phone, null, null, null);
  v_id uuid;
begin
  insert into assistance_requests (person_id, need, details, best_time)
  values (v_person_id, p_need, nullif(trim(p_details), ''), nullif(trim(p_best_time), ''))
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function upsert_person from public, anon, authenticated;
revoke execute on function submit_volunteer from public, anon, authenticated;
revoke execute on function submit_donor from public, anon, authenticated;
revoke execute on function submit_assistance_request from public, anon, authenticated;
grant execute on function upsert_person to service_role;
grant execute on function submit_volunteer to service_role;
grant execute on function submit_donor to service_role;
grant execute on function submit_assistance_request to service_role;
