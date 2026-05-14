import { NextRequest, NextResponse } from "next/server";
import { isLeadsPasswordConfigured, isLeadsSessionValid } from "@/lib/lead-system/leads-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ExportType = "all" | "audit-submissions" | "fix-plan-requests";

type AuditSubmissionRow = {
  id: string;
  audit_id: string | null;
  website_url: string;
  final_url: string | null;
  host: string | null;
  business_type: string;
  report_email: string;
  business_name: string | null;
  main_issue: string | null;
  revenue_leak_score: number | null;
  estimated_loss: string | null;
  scrape_warning: string | null;
  lead_stage: string;
  last_intent: string | null;
  last_intent_at: string | null;
  pricing_clicked_at: string | null;
  pricing_viewed_at: string | null;
  fix_form_opened_at: string | null;
  fix_plan_requested_at: string | null;
  created_at: string;
};

type FixPlanRequestRow = {
  id: string;
  audit_submission_id: string | null;
  name: string;
  email: string;
  country_code: string;
  phone: string;
  full_phone: string;
  business_name: string;
  website_url: string;
  main_issue: string | null;
  revenue_leak_score: number | null;
  source_plan: string | null;
  source: string;
  status: string;
  created_at: string;
};

type LeadCsvRow = {
  lead_type: string;
  record_id: string;
  created_at: string;
  stage_or_status: string;
  name: string;
  email: string;
  phone: string;
  business_name: string;
  website_url: string;
  host: string;
  business_type: string;
  main_issue: string;
  revenue_leak_score: number | string;
  estimated_loss: string;
  last_intent: string;
  pricing_clicked_at: string;
  pricing_viewed_at: string;
  fix_form_opened_at: string;
  fix_plan_requested_at: string;
  source_plan: string;
  audit_submission_id: string;
  audit_id: string;
  scrape_warning: string;
};

const auditSubmissionColumns = [
  "id",
  "audit_id",
  "website_url",
  "final_url",
  "host",
  "business_type",
  "report_email",
  "business_name",
  "main_issue",
  "revenue_leak_score",
  "estimated_loss",
  "scrape_warning",
  "lead_stage",
  "last_intent",
  "last_intent_at",
  "pricing_clicked_at",
  "pricing_viewed_at",
  "fix_form_opened_at",
  "fix_plan_requested_at",
  "created_at"
].join(",");

const fixPlanRequestColumns = [
  "id",
  "audit_submission_id",
  "name",
  "email",
  "country_code",
  "phone",
  "full_phone",
  "business_name",
  "website_url",
  "main_issue",
  "revenue_leak_score",
  "source_plan",
  "source",
  "status",
  "created_at"
].join(",");

const csvHeaders: Array<keyof LeadCsvRow> = [
  "lead_type",
  "record_id",
  "created_at",
  "stage_or_status",
  "name",
  "email",
  "phone",
  "business_name",
  "website_url",
  "host",
  "business_type",
  "main_issue",
  "revenue_leak_score",
  "estimated_loss",
  "last_intent",
  "pricing_clicked_at",
  "pricing_viewed_at",
  "fix_form_opened_at",
  "fix_plan_requested_at",
  "source_plan",
  "audit_submission_id",
  "audit_id",
  "scrape_warning"
];

function parseExportType(value: string | null): ExportType {
  if (value === "audit-submissions" || value === "fix-plan-requests") {
    return value;
  }

  return "all";
}

function csvEscape(value: string | number | null | undefined) {
  const normalized = value === null || value === undefined ? "" : String(value);

  if (!/[",\r\n]/.test(normalized)) {
    return normalized;
  }

  return `"${normalized.replace(/"/g, '""')}"`;
}

function toCsv(rows: LeadCsvRow[]) {
  const headerLine = csvHeaders.map(csvEscape).join(",");
  const rowLines = rows.map((row) => csvHeaders.map((header) => csvEscape(row[header])).join(","));

  return [headerLine, ...rowLines].join("\r\n");
}

function auditSubmissionToCsvRow(row: AuditSubmissionRow): LeadCsvRow {
  return {
    lead_type: "audit_submission",
    record_id: row.id,
    created_at: row.created_at,
    stage_or_status: row.lead_stage,
    name: "",
    email: row.report_email,
    phone: "",
    business_name: row.business_name || "",
    website_url: row.website_url,
    host: row.host || "",
    business_type: row.business_type,
    main_issue: row.main_issue || "",
    revenue_leak_score: row.revenue_leak_score ?? "",
    estimated_loss: row.estimated_loss || "",
    last_intent: row.last_intent || "",
    pricing_clicked_at: row.pricing_clicked_at || "",
    pricing_viewed_at: row.pricing_viewed_at || "",
    fix_form_opened_at: row.fix_form_opened_at || "",
    fix_plan_requested_at: row.fix_plan_requested_at || "",
    source_plan: "",
    audit_submission_id: row.id,
    audit_id: row.audit_id || "",
    scrape_warning: row.scrape_warning || ""
  };
}

function fixPlanRequestToCsvRow(row: FixPlanRequestRow): LeadCsvRow {
  return {
    lead_type: "fix_plan_request",
    record_id: row.id,
    created_at: row.created_at,
    stage_or_status: row.status,
    name: row.name,
    email: row.email,
    phone: row.full_phone || `${row.country_code} ${row.phone}`,
    business_name: row.business_name,
    website_url: row.website_url,
    host: "",
    business_type: "",
    main_issue: row.main_issue || "",
    revenue_leak_score: row.revenue_leak_score ?? "",
    estimated_loss: "",
    last_intent: "",
    pricing_clicked_at: "",
    pricing_viewed_at: "",
    fix_form_opened_at: "",
    fix_plan_requested_at: "",
    source_plan: row.source_plan || "",
    audit_submission_id: row.audit_submission_id || "",
    audit_id: "",
    scrape_warning: ""
  };
}

async function getAuditSubmissionRows() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("clientflow_audit_submissions")
    .select(auditSubmissionColumns)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as AuditSubmissionRow[];
}

async function getFixPlanRequestRows() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("clientflow_fix_plan_requests")
    .select(fixPlanRequestColumns)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as FixPlanRequestRow[];
}

async function getLeadRows(exportType: ExportType) {
  if (exportType === "audit-submissions") {
    return (await getAuditSubmissionRows()).map(auditSubmissionToCsvRow);
  }

  if (exportType === "fix-plan-requests") {
    return (await getFixPlanRequestRows()).map(fixPlanRequestToCsvRow);
  }

  const [auditRows, requestRows] = await Promise.all([getAuditSubmissionRows(), getFixPlanRequestRows()]);

  return [
    ...auditRows.map(auditSubmissionToCsvRow),
    ...requestRows.map(fixPlanRequestToCsvRow)
  ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function GET(request: NextRequest) {
  if (!isLeadsPasswordConfigured()) {
    return NextResponse.json({ error: "Lead export is not configured." }, { status: 503 });
  }

  if (!isLeadsSessionValid(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const exportType = parseExportType(request.nextUrl.searchParams.get("type"));
    const rows = await getLeadRows(exportType);
    const csv = toCsv(rows);
    const today = new Date().toISOString().slice(0, 10);
    const filename = `clientflow-${exportType}-leads-${today}.csv`;

    return new NextResponse(csv, {
      headers: {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${filename}"`,
        "content-type": "text/csv; charset=utf-8"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not export leads.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
