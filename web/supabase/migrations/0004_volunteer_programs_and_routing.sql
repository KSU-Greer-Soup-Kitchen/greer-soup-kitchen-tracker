-- Volunteers pick where they want to help: STEP, Weekday Soup Kitchen, or Soup Kitchen Weekend Group.
-- Weekend groups pick an open weekend date.
-- Each form is sent to the person in charge of it (STEP Director, Soup Kitchen Director,
-- Weekend Group Coordinator, and by type of help request).

alter table volunteers add column if not exists program text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'volunteers_program_check') then
    alter table volunteers add constraint volunteers_program_check
      check (program in ('step', 'weekday', 'weekend_group'));
  end if;
end;
$$;

-- Weekend dates a group can pick
create table if not exists weekend_dates (
  day date primary key check (extract(isodow from day) in (6, 7)),
  booked_person_id uuid references people (id) on delete set null,
  group_name text,
  group_size integer check (group_size is null or group_size between 1 and 200),
  booked_at timestamptz
);
create index if not exists weekend_dates_booked_person_id_idx on weekend_dates (booked_person_id);

-- Starter dates: every Saturday and Sunday for the next 12 weeks
insert into weekend_dates (day)
select d::date
from generate_series(current_date + 1, current_date + 84, interval '1 day') as d
where extract(isodow from d) in (6, 7)
on conflict (day) do nothing;

-- Who each form is emailed to. Fill in the email column once the client sends the addresses.
create table if not exists form_recipients (
  route text primary key,
  label text not null,
  email text
);

insert into form_recipients (route, label) values
  ('volunteer_step', 'STEP Director'),
  ('volunteer_weekday', 'Soup Kitchen Director'),
  ('volunteer_weekend_group', 'Weekend Group Coordinator'),
  ('help_housing', 'Housing or shelter (STEP) requests'),
  ('help_food', 'Food requests'),
  ('help_other', 'Other help requests'),
  ('donor', 'New donor forms')
on conflict (route) do nothing;

alter table weekend_dates enable row level security;
alter table form_recipients enable row level security;

-- Open dates for the volunteer form, soonest first
create or replace function list_open_weekend_dates() returns setof date
language sql
stable
security definer
set search_path = public
as $$
  select day from weekend_dates
  where booked_person_id is null and day > (now() at time zone 'America/New_York')::date
  order by day;
$$;

-- The volunteer form now also says where they want to help, and weekend groups book a date.
drop function if exists submit_volunteer(text, text, text, text, text, text, text[], text[], text);

create or replace function submit_volunteer(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_address text,
  p_age_group text,
  p_availability text[],
  p_skills text[],
  p_notes text,
  p_program text,
  p_weekend_date date,
  p_group_name text,
  p_group_size integer
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person_id uuid;
begin
  if p_program = 'weekend_group' then
    perform 1 from weekend_dates
      where day = p_weekend_date
        and booked_person_id is null
        and day > (now() at time zone 'America/New_York')::date
      for update;
    if not found then
      raise exception 'date_taken';
    end if;
  end if;

  v_person_id := upsert_person(p_email, p_first_name, p_last_name, p_phone, p_address, null, p_age_group);

  insert into volunteers (person_id, availability, skills, notes, program)
  values (v_person_id, coalesce(p_availability, '{}'), coalesce(p_skills, '{}'), nullif(trim(p_notes), ''), p_program)
  on conflict (person_id) do update set
    availability = excluded.availability,
    skills = excluded.skills,
    notes = coalesce(excluded.notes, volunteers.notes),
    program = excluded.program,
    active = true,
    updated_at = now();

  if p_program = 'weekend_group' then
    update weekend_dates
      set booked_person_id = v_person_id,
          group_name = nullif(trim(p_group_name), ''),
          group_size = p_group_size,
          booked_at = now()
      where day = p_weekend_date;
  end if;

  return v_person_id;
end;
$$;

revoke execute on function list_open_weekend_dates() from public, anon, authenticated;
revoke execute on function submit_volunteer(text, text, text, text, text, text, text[], text[], text, text, date, text, integer) from public, anon, authenticated;
grant execute on function list_open_weekend_dates() to service_role;
grant execute on function submit_volunteer(text, text, text, text, text, text, text[], text[], text, text, date, text, integer) to service_role;
