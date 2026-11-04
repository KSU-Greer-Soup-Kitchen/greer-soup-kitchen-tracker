# Greer Soup Kitchen Tracker

Volunteer, donor, and assistance tracking for Daily Bread Ministries / Greer Soup Kitchen (Greer, SC).

Built by KSU SWE 4713 Greer Soup Kitchen team (Fall 2026): Zach Vaughn (lead), Debora Sanchez, Joe Knight, Lydia Amrouche, Olakay Ladapo, Tristan Prater.

## What it does

**Public site**
- Volunteer sign-up: volunteers choose STEP, Weekday Soup Kitchen, or a Weekend Group. Weekend groups book one open Saturday or Sunday (one group per date).
- Donor form, with online giving through PayPal (PayPal account, Venmo, or card)
- Get Help form for people asking for assistance

**Staff site** (login required)
- Dashboard with this month's numbers and recent activity
- Volunteers (with logged hours), donors, donations, and help requests
- One page per person, linking every form and gift by email
- Manual entry for cash, check, and other gifts
- Reports on donations, volunteer hours, and donor age groups, with a spreadsheet (CSV) export
- One message to all active volunteers (opens in the staff member's email with everyone on BCC)

## Status

- Milestone 1 (Oct 11): Interactive Figma prototype, approved by the client
- Milestone 2 (Nov 1): Working system deployed, including the client's Milestone 1 feedback
- Milestone 3 (Nov 22): Live PayPal, form emails, contact form, website redesign mockup, handoff, including the client's Milestone 2 feedback

## Tech stack

Next.js (React) on Netlify, Supabase (PostgreSQL database and staff login), PayPal Orders API and webhooks, Resend (email), Vitest (tests).

## Setup

Everything lives in `web/`. You need Node 22+ and a Supabase project.

1. **Database.** In the Supabase SQL Editor, run the files in `web/supabase/migrations/` in order (0001 to 0004). Run each one once; to change the database later, add a new numbered file.
2. **Staff logins.** In Supabase, go to Authentication > Users > Add user for each staff member. Turn off public sign-ups in Authentication settings so nobody else can make an account.
3. **Settings.** Copy `web/.env.example` to `web/.env.local` (or set them in Netlify's environment variables):
    - Required: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`
    - Optional: `PAYPAL_ENV` (`sandbox` or `live`, default sandbox), `PAYPAL_WEBHOOK_ID`, `RESEND_API_KEY`, `RESEND_FROM`
4. **Run it.** In `web/`: `npm install`, then `npm run dev` (local) or `npm run build` (what Netlify runs). `npm test` runs the unit tests.

Netlify settings: base directory `web`. Pushing to `main` deploys automatically.

## Managing the site

All of these are done in Supabase > Table Editor:

- **Who gets each form by email:** the `email` column of `form_recipients`. A blank email means the form is still saved and shown to staff, just not emailed. Emails send only when `RESEND_API_KEY` is set.
- **Weekend dates offered to groups:** the `weekend_dates` table. Add a row (Saturday or Sunday) to offer a date; delete one to remove it.
- **Staff accounts:** Authentication > Users.

***NOTE TO DAILY BREAD MINISTRIES / GREER SOUP KITCHEN: Never put email addresses, keys, or passwords in this repo.***