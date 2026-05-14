# ClientFlow Website Revenue Audit

AI-powered lead generation funnel that analyzes a business website, produces a structured revenue leak audit, and converts visitors into qualified implementation requests.

**Live demo:** https://clientflow-outreach.vercel.app

## Features

- Website URL, business type, and email capture flow.
- Website scraping and structured AI analysis.
- Revenue Leak Score, main issue, page-level fixes, missed opportunities, fix plan, and impact projection.
- Fix-plan request modal with name, email, phone, business, website, and audit context.
- Pricing/fix-plan intent tracking.
- Supabase storage for audit submissions and fix-plan requests.
- Hidden password-protected lead CSV export page at `/leads`.
- Legal, privacy, contact, pricing, and public landing pages.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- OpenAI API
- Supabase
- Vercel

## Setup

Create `.env.local` from `.env.example`.

```env
NEXT_PUBLIC_APP_URL=http://localhost:3001

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

LEADS_PASSWORD=
```

Supabase is optional for local exploration. If configured, the app saves lead data in clean tables:

- `clientflow_audit_submissions`: website URL, business type, and email used to generate the audit.
- `clientflow_fix_plan_requests`: name, email, phone, business name, website, and audit context from the fix-plan form.
- `clientflow_website_audits`: full audit JSON and scraped website details for internal reference.

Run `supabase/clientflow_schema.sql` in the Supabase SQL editor to create the database tables.

## Download Leads

Set `LEADS_PASSWORD` locally and in Vercel. The hidden `/leads` page is not linked from the public site, is marked `noindex`, and requires this password before downloading CSV files.

Open `https://clientflow-outreach.vercel.app/leads`, enter the password, then choose all leads, audit leads, or fix-plan requests.

## Run

```bash
npm install
npm run dev
```

Use `http://localhost:3001` if another project is running on `3000`.

## Build

```bash
npm run build
```
