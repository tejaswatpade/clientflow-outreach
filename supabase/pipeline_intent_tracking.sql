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

create index if not exists clientflow_audit_submissions_stage_created_idx
  on public.clientflow_audit_submissions(lead_stage, created_at desc);
