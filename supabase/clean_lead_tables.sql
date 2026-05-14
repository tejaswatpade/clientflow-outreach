create extension if not exists pgcrypto;

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

alter table public.clientflow_fix_plan_requests
  add column if not exists audit_submission_id uuid references public.clientflow_audit_submissions(id) on delete set null;

alter table public.clientflow_fix_plan_requests
  add column if not exists legacy_source_audit_id uuid unique references public.clientflow_website_audits(id) on delete set null;

alter table public.clientflow_audit_submissions
  add column if not exists lead_stage text not null default 'warm';

alter table public.clientflow_audit_submissions
  add column if not exists last_intent text;

alter table public.clientflow_audit_submissions
  add column if not exists last_intent_at timestamptz;

alter table public.clientflow_audit_submissions
  add column if not exists pricing_clicked_at timestamptz;

alter table public.clientflow_audit_submissions
  add column if not exists pricing_viewed_at timestamptz;

alter table public.clientflow_audit_submissions
  add column if not exists fix_form_opened_at timestamptz;

alter table public.clientflow_audit_submissions
  add column if not exists fix_plan_requested_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clientflow_audit_submissions_lead_stage_check'
  ) then
    alter table public.clientflow_audit_submissions
      add constraint clientflow_audit_submissions_lead_stage_check
      check (lead_stage in ('warm', 'hot', 'submitted'));
  end if;
end $$;

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

alter table public.clientflow_audit_submissions enable row level security;
alter table public.clientflow_fix_plan_requests enable row level security;

insert into public.clientflow_fix_plan_requests (
  legacy_source_audit_id,
  name,
  email,
  country_code,
  phone,
  full_phone,
  business_name,
  website_url,
  main_issue,
  revenue_leak_score,
  source_plan,
  source,
  created_at
)
select
  id,
  coalesce(nullif(analysis->>'name', ''), 'Unknown'),
  coalesce(nullif(analysis->>'email', ''), 'unknown@example.com'),
  coalesce(nullif(analysis->>'countryCode', ''), '+1'),
  coalesce(nullif(analysis->>'phone', ''), ''),
  coalesce(nullif(analysis->>'fullPhone', ''), concat(coalesce(analysis->>'countryCode', '+1'), ' ', coalesce(analysis->>'phone', ''))),
  coalesce(nullif(analysis->>'businessName', ''), business_name, 'Unknown business'),
  coalesce(nullif(analysis->>'websiteUrl', ''), website_url),
  coalesce(nullif(analysis->>'mainIssue', ''), main_issue),
  case
    when coalesce(analysis->>'revenueLeakScore', '') ~ '^[0-9]+$'
      then (analysis->>'revenueLeakScore')::integer
    else null
  end,
  nullif(analysis->>'sourcePlan', ''),
  coalesce(nullif(analysis->>'source', ''), 'website_revenue_audit'),
  created_at
from public.clientflow_website_audits
where issue_category = 'Fix plan request'
on conflict (legacy_source_audit_id) do nothing;

-- Optional cleanup after you confirm the backfill worked:
-- delete from public.clientflow_website_audits where issue_category = 'Fix plan request';
