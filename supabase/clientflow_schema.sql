create extension if not exists pgcrypto;

create table if not exists public.clientflow_users (
  id uuid primary key default gen_random_uuid(),
  email text,
  is_unlimited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.clientflow_audit_usage (
  user_id uuid not null references public.clientflow_users(id) on delete cascade,
  usage_date date not null,
  audit_count integer not null default 0 check (audit_count >= 0),
  limit_count integer not null default 3 check (limit_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create table if not exists public.clientflow_website_audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.clientflow_users(id) on delete cascade,
  website_url text not null,
  final_url text,
  host text,
  business_name text,
  industry text,
  issue_category text,
  main_issue text,
  analysis jsonb not null,
  scraped jsonb not null,
  scrape_warning text,
  created_at timestamptz not null default now()
);

create table if not exists public.clientflow_audit_submissions (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references public.clientflow_website_audits(id) on delete set null,
  website_url text not null,
  final_url text,
  host text,
  business_type text not null,
  report_email text not null,
  business_name text,
  main_issue text,
  revenue_leak_score integer,
  estimated_loss text,
  scrape_warning text,
  lead_stage text not null default 'warm' check (lead_stage in ('warm', 'hot', 'submitted')),
  last_intent text,
  last_intent_at timestamptz,
  pricing_clicked_at timestamptz,
  pricing_viewed_at timestamptz,
  fix_form_opened_at timestamptz,
  fix_plan_requested_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.clientflow_fix_plan_requests (
  id uuid primary key default gen_random_uuid(),
  audit_submission_id uuid references public.clientflow_audit_submissions(id) on delete set null,
  legacy_source_audit_id uuid unique references public.clientflow_website_audits(id) on delete set null,
  name text not null,
  email text not null,
  country_code text not null,
  phone text not null,
  full_phone text not null,
  business_name text not null,
  website_url text not null,
  main_issue text,
  revenue_leak_score integer,
  source_plan text,
  source text not null default 'website_revenue_audit',
  status text not null default 'new' check (status in ('new', 'reviewed', 'contacted', 'won', 'lost')),
  created_at timestamptz not null default now()
);

create table if not exists public.clientflow_gmail_sessions (
  user_id uuid primary key references public.clientflow_users(id) on delete cascade,
  email text not null,
  encrypted_refresh_token text not null,
  connected_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.clientflow_outreach_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.clientflow_users(id) on delete cascade,
  audit_id uuid references public.clientflow_website_audits(id) on delete set null,
  recipient_email text not null,
  gmail_message_id text,
  selected_email jsonb not null,
  status text not null check (status in ('sent', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists clientflow_website_audits_user_created_idx
  on public.clientflow_website_audits(user_id, created_at desc);

create index if not exists clientflow_audit_submissions_created_idx
  on public.clientflow_audit_submissions(created_at desc);

create index if not exists clientflow_audit_submissions_email_created_idx
  on public.clientflow_audit_submissions(report_email, created_at desc);

create index if not exists clientflow_audit_submissions_stage_created_idx
  on public.clientflow_audit_submissions(lead_stage, created_at desc);

create index if not exists clientflow_fix_plan_requests_created_idx
  on public.clientflow_fix_plan_requests(created_at desc);

create index if not exists clientflow_fix_plan_requests_status_created_idx
  on public.clientflow_fix_plan_requests(status, created_at desc);

create index if not exists clientflow_outreach_sends_user_created_idx
  on public.clientflow_outreach_sends(user_id, created_at desc);

alter table public.clientflow_users enable row level security;
alter table public.clientflow_audit_usage enable row level security;
alter table public.clientflow_website_audits enable row level security;
alter table public.clientflow_audit_submissions enable row level security;
alter table public.clientflow_fix_plan_requests enable row level security;
alter table public.clientflow_gmail_sessions enable row level security;
alter table public.clientflow_outreach_sends enable row level security;

-- The Next.js server writes through SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- Add user-facing RLS policies later when Supabase Auth accounts are added.
