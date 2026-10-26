-- How each donation was paid.
-- Manual gifts: cash, check, venmo, or other.
-- PayPal gifts: how the donor paid inside PayPal (paypal wallet, venmo, card, apple_pay, google_pay, other).
-- Run once in the Supabase SQL editor, after 0001.

alter table donations add column payment_method text;

alter table donations add constraint donations_payment_method_check
  check (payment_method in ('cash', 'check', 'venmo', 'paypal', 'card', 'apple_pay', 'google_pay', 'other'));

-- Staff entering a gift by hand must say how it was paid
alter table donations add constraint donations_manual_payment_method_check
  check (source <> 'manual' or payment_method is not null);

-- The save function gets one more input, so replace the old version
drop function if exists record_paypal_donation(text, text, text, numeric, text, timestamptz, text, text);

create function record_paypal_donation(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_amount numeric,
  p_currency text,
  p_donated_at timestamptz,
  p_txn_id text,
  p_event_id text,
  p_payment_method text
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

  insert into donations (person_id, amount, currency, donated_at, source, payment_method, paypal_txn_id, paypal_event_id)
  values (v_person_id, p_amount, p_currency, p_donated_at, 'paypal', p_payment_method, p_txn_id, p_event_id)
  on conflict (paypal_txn_id) do nothing;

  get diagnostics v_added = row_count;
  return v_added > 0;
end;
$$;

revoke execute on function record_paypal_donation from public, anon, authenticated;
grant execute on function record_paypal_donation to service_role;
