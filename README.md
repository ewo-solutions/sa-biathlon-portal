# SA Biathlon Portal

Custom member portal for SA Biathlon, replacing the legacy Azure app. Built as a
standalone Next.js application separate from the WordPress marketing site — the
marketing/brochure pages stay on WordPress; this app only serves the logged-in
admin and athlete dashboards, matched to the "Athlete Dashboard" and "Admin
Dashboard" Figma mockups.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 — design tokens in the `@theme` block in `src/app/globals.css`
- [Prisma](https://www.prisma.io) + PostgreSQL
- [Auth.js](https://authjs.dev) (credentials provider) with role-based access
- [Recharts](https://recharts.org) for the admin Statistics charts

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and AUTH_SECRET
npx prisma migrate dev --name init
npm run db:seed        # creates a sample admin + athlete login
npm run dev             # http://localhost:3000
```

Seeded accounts (password `password123` for both):

- `admin@sabiathlon.co.za` — admin dashboard
- `athlete@sabiathlon.co.za` — athlete dashboard

## Project layout

- `src/app/(auth)/login` — login page
- `src/app/(portal)/(athlete)/athlete/*` — Home, Upcoming Events, Results, My
  Profile, Membership, Support
- `src/app/(portal)/(admin)/admin/*` — Home, Events, Edit & Create Events,
  Athletes Profiles, Statistics, My Profile
- `src/proxy.ts` — route middleware gating `/admin/*` and `/athlete/*` by
  session role
- `prisma/schema.prisma` — data model (User, AthleteProfile, Event,
  EventRegistration, Result, Membership, Payment)
- `prisma/seed.ts` — sample data for local development

## Data model

Derived from the Figma dashboards and the functionality the Azure app needs to
replicate:

- **User** — one account per person, `role` decides ADMIN vs ATHLETE dashboard
- **AthleteProfile** — athlete-only fields (club, discipline, ID number)
- **Event** / **EventRegistration** — events admins create, athletes sign up for
- **Result** — season-indexed results archive, per athlete
- **Membership** — yearly season affiliation (cancel/renew flow)
- **Payment** — placeholder for a payment gateway integration; linked
  optionally to either an event registration or a membership renewal

## Known gaps / next steps

This scaffold covers the UI flows and data model visible in the Figma
mockups. Still outstanding before this can replace the Azure app:

1. **Data migration** — no Azure DB access has been provided yet. Once we get
   read access or an export (members, events, results, membership history),
   we need a migration script mapping Azure's schema into this Prisma schema.
2. **Payment gateway** — `Payment` model exists but isn't wired to a real
   provider (PayFast, Peach Payments, Stripe, etc. — confirm which one SA
   Biathlon currently uses on Azure).
3. **Email notifications** — event sign-up confirmations, membership renewal
   reminders, etc. Not yet implemented.
4. **File uploads** — profile pictures and results documents currently store
   a URL string only; needs an actual storage backend (S3/Azure
   Blob/Vercel Blob) and upload UI.
5. **Athlete self-registration** — currently accounts are created via seed/
   admin only; a public sign-up flow may be needed if the Azure app offered
   one.
6. Any Azure-app functionality not visible in the Figma mockups (e.g.
   integrations with SA Biathlon's international federation reporting) is
   not yet accounted for — pending the functional inventory.

## Deployment

Not yet deployed. Plan is Vercel for the app, with a managed Postgres
instance (Neon/Supabase, or Azure Database for PostgreSQL if the client wants
to stay within Azure). WordPress marketing site is unaffected and untouched.
