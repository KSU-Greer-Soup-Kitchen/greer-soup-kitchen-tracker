-- Contact form messages and STEP family shelter applications.
-- Run once in the Supabase SQL editor, after 0004.

-- Messages from the website contact form
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  topic text not null check (topic in ('kitchen', 'step', 'other')),
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  staff_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contact_messages_status_idx on contact_messages (status);

-- STEP family shelter applications.
-- The answers (SSNs, health, legal history...) are locked with the app's
-- STEP_APPLICATION_KEY before they are saved, so `answers` is unreadable here.
-- Only the name and phone are kept readable so staff can see the list.
create table if not exists step_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text not null,
  phone text,
  email text,
  adult_count int not null check (adult_count between 1 and 4),
  child_count int not null check (child_count between 0 and 8),
  answers text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  staff_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists step_applications_status_idx on step_applications (status);

-- Same as the other tables: no policies, so only the server (secret key) gets in
alter table contact_messages enable row level security;
alter table step_applications enable row level security;
revoke all on contact_messages from anon, authenticated;
revoke all on step_applications from anon, authenticated;

-- Who gets emailed about each one (fill in the emails in the Table Editor)
insert into form_recipients (route, label) values
  ('contact_kitchen', 'Contact form: Soup Kitchen'),
  ('contact_step', 'Contact form: STEP'),
  ('contact_other', 'Contact form: something else'),
  ('step_application', 'STEP family shelter applications')
on conflict (route) do nothing;
