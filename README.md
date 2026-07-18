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

## Legacy Azure app (migration source)

The system being replaced is confirmed live and documented as follows
(from the client's dev, current as of this writing):

**Environment**
- Resource group `rg-sabiathlon-prod`, region South Africa North
- App Service `sabiathlon-prod` on plan `asp-sabiathlon-prod` (Windows, Basic B1)
- Azure SQL server `sql-sabiathlon-ewo.database.windows.net`, database `sabiathlon`
- Application Insights enabled
- Live URL: https://sabiathlon-prod-b3c5d7a7c7fxfch9.southafricanorth-01.azurewebsites.net/
- Access status: Azure Reader role is being arranged for us (pending a
  Microsoft account email to grant it to). Source was supplied as a local
  Git repo ZIP — no confirmed GitHub/Azure DevOps remote. A BACPAC backup
  exists and has already been restored into the live Azure SQL instance;
  DB credentials will come via a secure channel, not email.

**Architecture**
- ASP.NET Core on .NET 8 (originally targeted .NET 6, since upgraded),
  Windows App Service
- Azure SQL: 34 tables (24 with data), 11 stored procedures, 18 FK
  relationships. Core entities: athletes, athlete seasons, competitions,
  heats, results, schools, provinces, seasons, groups, plus ASP.NET
  Identity users/roles — broader than our current Prisma schema, which is
  missing heats, schools, provinces, and groups as first-class entities.
- Public-facing + members-only. Public self-registration collects email,
  password, name, DOB, SA ID number, gender. Existing accounts/roles
  carried over with the DB. Admin functionality is role-restricted.
  Auth via ASP.NET Identity; JWT config also present for some API surfaces.
- Row counts and DB size not yet pulled — to be recorded once Reader
  access is in place.

**Integrations**
- Email: migrated off a legacy provider to direct MailKit/SMTP, tested
  end-to-end.
- PDF generation: previously via the now-retired Techla service. On-screen
  reports still work; PDF export is currently broken. Proposed fix is a
  private Gotenberg PDF-rendering service in Azure.
- Reporting/results: competition, ranking, and results run in-app/in-DB.
- WordPress/Formidable integration: planned, not yet implemented.
- No payment gateway, SMS, SAIS/federation reporting, external
  calendar/results service, Azure Functions, Blob Storage, or Key Vault
  usage confirmed yet — to be verified once we have source + Azure access.

**Compliance note** — the DB holds DOB and SA ID numbers, including for
minors. POPIA compliance, role permissions, secret rotation, and secure
data handling need to be in scope for the migration, not an afterthought.

**Still outstanding to unblock migration**: WordPress admin login,
SFTP/SSH or hosting panel access for the new site, and confirmation of the
Formidable Forms licence tier/add-ons (Views, Login, User Registration,
Visual Views, Digital Signature, etc.).

## Known gaps / next steps

This scaffold covers the UI flows and data model visible in the Figma
mockups. Still outstanding before this can replace the Azure app:

1. **Data migration** — Azure Reader access, source code, and DB
   credentials are being arranged (see "Legacy Azure app" above). Once
   in place, we need row counts/schema detail and a migration script
   mapping Azure SQL's schema (athletes, seasons, competitions, heats,
   results, schools, provinces, groups) into this Prisma schema, which
   currently doesn't model heats/schools/provinces/groups separately.
2. **Payment gateway** — `Payment` model exists but isn't wired to a real
   provider (PayFast, Peach Payments, Stripe, etc. — confirm which one SA
   Biathlon currently uses on Azure, if any — none confirmed so far).
3. **Email notifications** — event sign-up confirmations, membership renewal
   reminders, etc. Not yet implemented.
4. **Athlete self-registration** — currently accounts are created via seed/
   admin only; the Azure app supports public self-registration (email,
   password, name, DOB, SA ID number, gender), so a matching flow may be
   needed here.
5. **PDF export** — broken on the legacy app (Techla retired); Gotenberg is
   the proposed replacement. Needs a decision on whether that's ported
   here or handled another way.
6. **POPIA compliance** — DOB and SA ID numbers (including minors) are in
   scope; needs explicit handling for consent, access control, and data
   retention once migration starts.

## Deployment

Not yet deployed. Plan is Vercel for the app, with a managed Postgres
instance (Neon/Supabase, or Azure Database for PostgreSQL if the client wants
to stay within Azure). WordPress marketing site is unaffected and untouched.
