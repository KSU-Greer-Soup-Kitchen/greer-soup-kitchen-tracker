"use server";

// Changes staff can make from the dashboard

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, signIn, signOut } from "../../lib/auth";
import { AGE_GROUPS, MANUAL_PAYMENT_METHODS, REQUEST_STATUS } from "../../lib/options";
import { db } from "../../lib/supabase";
import { formValues, type FieldErrors, type FormState } from "../../lib/validate";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f-]{36}$/i;

function text(form: FormData, name: string, max = 500): string {
  const v = form.get(name);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function failed(form: FormData, prev: FormState, errors: FieldErrors): FormState {
  return { status: "error", errors, values: formValues(form), attempt: prev.attempt + 1 };
}

function done(prev: FormState): FormState {
  revalidatePath("/staff", "layout");
  return { status: "success", errors: {}, values: {}, attempt: prev.attempt + 1 };
}

const SAVE_FAILED = { form: "That did not save. Please try again. If it keeps happening, write down what you entered and contact the tech team." };

// ---------- Login ----------

export async function logIn(prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email", 200).toLowerCase();
  const password = typeof form.get("password") === "string" ? (form.get("password") as string) : "";
  const errors: FieldErrors = {};
  if (!email) errors.email = "Enter your email address";
  if (!password) errors.password = "Enter your password";
  if (Object.keys(errors).length) return failed(form, prev, errors);

  let ok = false;
  try {
    ok = await signIn(email, password);
  } catch (err) {
    console.error("Staff login:", err instanceof Error ? err.message : err);
    return failed(form, prev, { form: "Login is not working right now. Please try again in a few minutes." });
  }
  if (!ok) {
    return { ...failed(form, prev, { form: "That email and password do not match. Please check them and try again." }), values: { email } };
  }
  redirect("/staff");
}

export async function logOut(): Promise<void> {
  await signOut();
  redirect("/staff/login");
}

// ---------- Gifts ----------

// Finds the person picked in the list, or adds the new one typed in
async function personFromForm(form: FormData, errors: FieldErrors): Promise<string | null> {
  const picked = text(form, "person_id");
  if (picked && picked !== "new") {
    if (!UUID.test(picked)) errors.person_id = "Choose a person from the list";
    return picked;
  }
  const first = text(form, "first_name", 100);
  const last = text(form, "last_name", 100);
  const email = text(form, "email", 200).toLowerCase();
  if (!picked) {
    errors.person_id = "Choose a person, or pick \"Someone new\" and type their name";
    return null;
  }
  if (!first && !last) errors.first_name = "Type the new person's name";
  if (email && !EMAIL.test(email)) errors.email = "Check the email address. It should look like name@example.com";
  if (Object.keys(errors).length) return null;
  const { data, error } = await db().rpc("upsert_person", {
    p_email: email || null,
    p_first_name: first,
    p_last_name: last,
    p_phone: text(form, "phone", 40),
    p_address: null,
    p_city: null,
    p_age_group: null,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function addGift(prev: FormState, form: FormData): Promise<FormState> {
  await requireStaff();
  const errors: FieldErrors = {};
  const amount = Math.round(Number(text(form, "amount").replace(/[$,]/g, "")) * 100) / 100;
  const date = text(form, "donated_on");
  const method = text(form, "payment_method");
  const tributeType = text(form, "tribute_type");
  const tributeName = text(form, "tribute_name", 200);
  if (!(amount > 0) || amount > 1000000) errors.amount = "Enter the amount, like 25 or 25.50";
  if (!DATE.test(date)) errors.donated_on = "Enter the date of the gift";
  if (!MANUAL_PAYMENT_METHODS.some((m) => m.value === method)) errors.payment_method = "Choose how it was paid";
  if (tributeType && !["honor", "memory"].includes(tributeType)) errors.tribute_type = "Choose honor or memory";
  if (tributeType && !tributeName) errors.tribute_name = "Type the name of the person the gift honors";

  try {
    const personId = Object.keys(errors).length ? null : await personFromForm(form, errors);
    if (Object.keys(errors).length || !personId) return failed(form, prev, errors);
    const { error } = await db()
      .from("donations")
      .insert({
        person_id: personId,
        amount,
        currency: "USD",
        // Noon in Greer, so the gift never slips into the day before
        donated_at: `${date}T12:00:00-05:00`,
        source: "manual",
        payment_method: method,
        tribute_type: tributeType || null,
        tribute_name: tributeType ? tributeName : null,
        notes: text(form, "notes", 500) || null,
      });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error("Add gift:", err instanceof Error ? err.message : err);
    return failed(form, prev, SAVE_FAILED);
  }
  return done(prev);
}

// Only gifts typed in by hand can be removed. PayPal gifts stay, so the books match PayPal.
export async function deleteGift(form: FormData): Promise<void> {
  await requireStaff();
  const id = text(form, "id");
  if (!UUID.test(id)) return;
  const { error } = await db().from("donations").delete().eq("id", id).eq("source", "manual");
  if (error) throw new Error(error.message);
  revalidatePath("/staff", "layout");
}

// ---------- Volunteers ----------

export async function logHours(prev: FormState, form: FormData): Promise<FormState> {
  await requireStaff();
  const errors: FieldErrors = {};
  const personId = text(form, "person_id");
  const date = text(form, "shift_date");
  const hours = Math.round(Number(text(form, "hours")) * 100) / 100;
  if (!UUID.test(personId)) errors.person_id = "Choose the volunteer";
  if (!DATE.test(date)) errors.shift_date = "Enter the date they helped";
  if (!(hours > 0) || hours > 24) errors.hours = "Enter the hours, like 3 or 2.5";
  if (Object.keys(errors).length) return failed(form, prev, errors);

  const { error } = await db()
    .from("volunteer_shifts")
    .insert({ person_id: personId, shift_date: date, hours, task: text(form, "task", 200) || null });
  if (error) {
    console.error("Log hours:", error.message);
    return failed(form, prev, SAVE_FAILED);
  }
  return done(prev);
}

export async function deleteShift(form: FormData): Promise<void> {
  await requireStaff();
  const id = text(form, "id");
  if (!UUID.test(id)) return;
  const { error } = await db().from("volunteer_shifts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/staff", "layout");
}

export async function setVolunteerActive(form: FormData): Promise<void> {
  await requireStaff();
  const id = text(form, "person_id");
  if (!UUID.test(id)) return;
  const { error } = await db()
    .from("volunteers")
    .update({ active: text(form, "active") === "true", updated_at: new Date().toISOString() })
    .eq("person_id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/staff", "layout");
}

// ---------- Help requests ----------

export async function updateRequest(prev: FormState, form: FormData): Promise<FormState> {
  await requireStaff();
  const id = text(form, "id");
  const status = text(form, "status");
  if (!UUID.test(id) || !REQUEST_STATUS.some((s) => s.value === status)) {
    return failed(form, prev, { status: "Choose a status" });
  }
  const { error } = await db()
    .from("assistance_requests")
    .update({ status, staff_notes: text(form, "staff_notes", 2000) || null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("Update request:", error.message);
    return failed(form, prev, SAVE_FAILED);
  }
  return done(prev);
}

// ---------- People ----------

export async function updatePerson(prev: FormState, form: FormData): Promise<FormState> {
  await requireStaff();
  const id = text(form, "id");
  const email = text(form, "email", 200).toLowerCase();
  const ageGroup = text(form, "age_group");
  const errors: FieldErrors = {};
  if (!UUID.test(id)) errors.form = "This person could not be found";
  if (email && !EMAIL.test(email)) errors.email = "Check the email address. It should look like name@example.com";
  if (ageGroup && !AGE_GROUPS.some((a) => a.value === ageGroup)) errors.age_group = "Choose an age group from the list";
  if (Object.keys(errors).length) return failed(form, prev, errors);

  const { error } = await db()
    .from("people")
    .update({
      first_name: text(form, "first_name", 100) || null,
      last_name: text(form, "last_name", 100) || null,
      email: email || null,
      phone: text(form, "phone", 40) || null,
      address: text(form, "address", 300) || null,
      city: text(form, "city", 100) || null,
      age_group: ageGroup || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    // 23505 = another person already has this email
    if (error.code === "23505") return failed(form, prev, { email: "Someone else already has this email address" });
    console.error("Update person:", error.message);
    return failed(form, prev, SAVE_FAILED);
  }
  return done(prev);
}
