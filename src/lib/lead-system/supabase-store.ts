import type { ImplementationRequestInput, LeadIntentInput, LeadIntentType, ScrapedWebsite, WebsiteRevenueAudit } from "./types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type SaveAuditInput = {
  audit: WebsiteRevenueAudit;
  scraped: ScrapedWebsite;
  scrapeWarning?: string;
  reportEmail?: string;
};

type SaveAuditResult = {
  auditId: string | null;
  auditSubmissionId: string | null;
  savedTo: string[];
};

function getStoreClient() {
  return getSupabaseAdmin() as any;
}

function getHost(value: string) {
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).host.replace(/^www\./, "");
  } catch {
    return value.replace(/^https?:\/\//i, "").replace(/^www\./, "").split("/")[0] || value;
  }
}

async function createStorageUser(email?: string) {
  const supabase = getStoreClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("clientflow_users")
    .insert({
      email: email || null,
      last_seen_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (error) {
    console.error("Supabase storage user insert failed", error);
    return null;
  }

  return (data as { id: string }).id;
}

async function saveAuditSubmission(input: SaveAuditInput, auditId: string | null) {
  const supabase = getStoreClient();
  if (!supabase || !input.reportEmail) {
    return null;
  }

  const { data, error } = await supabase
    .from("clientflow_audit_submissions")
    .insert({
      audit_id: auditId,
      website_url: input.audit.websiteUrl || input.scraped.url,
      final_url: input.scraped.finalUrl,
      host: input.scraped.host,
      business_type: input.audit.businessType,
      report_email: input.reportEmail,
      business_name: input.audit.businessName,
      main_issue: input.audit.mainIssue,
      revenue_leak_score: input.audit.revenueLeakScore,
      estimated_loss: input.audit.estimatedLoss,
      scrape_warning: input.scrapeWarning || null
    })
    .select("id")
    .single();

  if (error) {
    console.error("Supabase clean audit submission insert failed", error);
    return null;
  }

  return (data as { id: string }).id;
}

export async function saveRevenueAudit(input: SaveAuditInput): Promise<SaveAuditResult | null> {
  const supabase = getStoreClient();
  if (!supabase) {
    return null;
  }

  let auditId: string | null = null;
  const savedTo: string[] = [];
  const userId = await createStorageUser(input.reportEmail);

  if (userId) {
    const { data, error } = await supabase
      .from("clientflow_website_audits")
      .insert({
        user_id: userId,
        website_url: input.audit.websiteUrl || input.scraped.url,
        final_url: input.scraped.finalUrl,
        host: input.scraped.host,
        business_name: input.audit.businessName,
        industry: input.audit.businessType,
        issue_category: "Website revenue leak",
        main_issue: input.audit.mainIssue,
        analysis: {
          ...input.audit,
          reportEmail: input.reportEmail || ""
        },
        scraped: input.scraped,
        scrape_warning: input.scrapeWarning || null
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase full audit insert failed", error);
    } else {
      auditId = (data as { id: string }).id;
      savedTo.push("clientflow_website_audits");
    }
  }

  const auditSubmissionId = await saveAuditSubmission(input, auditId);
  if (auditSubmissionId) {
    savedTo.push("clientflow_audit_submissions");
  }

  if (!auditId && !auditSubmissionId) {
    return null;
  }

  return {
    auditId,
    auditSubmissionId,
    savedTo
  };
}

function getIntentUpdate(intent: LeadIntentType) {
  const now = new Date().toISOString();
  const update: Record<string, string> = {
    lead_stage: intent === "fix_plan_requested" ? "submitted" : "hot",
    last_intent: intent,
    last_intent_at: now
  };

  if (intent === "pricing_clicked") {
    update.pricing_clicked_at = now;
  }

  if (intent === "pricing_viewed") {
    update.pricing_viewed_at = now;
  }

  if (intent === "fix_form_opened") {
    update.fix_form_opened_at = now;
  }

  if (intent === "fix_plan_requested") {
    update.fix_plan_requested_at = now;
  }

  return update;
}

export async function markAuditLeadIntent(input: LeadIntentInput) {
  const supabase = getStoreClient();
  if (!supabase) {
    return null;
  }

  const update = getIntentUpdate(input.intent);

  if (input.auditSubmissionId) {
    const { data, error } = await supabase
      .from("clientflow_audit_submissions")
      .update(update)
      .eq("id", input.auditSubmissionId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Supabase lead intent update failed", error);
      return null;
    }

    return (data as { id: string } | null)?.id ?? null;
  }

  if (!input.email || !input.websiteUrl) {
    return null;
  }

  const { data, error } = await supabase
    .from("clientflow_audit_submissions")
    .update(update)
    .eq("report_email", input.email)
    .eq("host", getHost(input.websiteUrl))
    .select("id");

  if (error) {
    console.error("Supabase lead intent fallback update failed", error);
    return null;
  }

  return Array.isArray(data) ? (data[0] as { id: string } | undefined)?.id ?? null : null;
}

export async function saveImplementationRequest(input: ImplementationRequestInput) {
  const supabase = getStoreClient();
  if (!supabase) {
    return null;
  }

  const requestPayload = {
    auditSubmissionId: input.auditSubmissionId || null,
    name: input.name,
    email: input.email,
    countryCode: input.countryCode,
    phone: input.phone,
    fullPhone: `${input.countryCode} ${input.phone}`,
    businessName: input.businessName,
    websiteUrl: input.websiteUrl,
    mainIssue: input.mainIssue || null,
    revenueLeakScore: input.revenueLeakScore || null,
    sourcePlan: input.sourcePlan || null,
    source: "website_revenue_audit",
    submittedAt: new Date().toISOString()
  };

  const cleanLead = await supabase
    .from("clientflow_fix_plan_requests")
    .insert({
      audit_submission_id: input.auditSubmissionId || null,
      name: input.name,
      email: input.email,
      country_code: input.countryCode,
      phone: input.phone,
      full_phone: `${input.countryCode} ${input.phone}`,
      business_name: input.businessName,
      website_url: input.websiteUrl,
      main_issue: input.mainIssue || null,
      revenue_leak_score: input.revenueLeakScore || null,
      source_plan: input.sourcePlan || null,
      source: "website_revenue_audit"
    })
    .select("id")
    .single();

  if (!cleanLead.error) {
    await markAuditLeadIntent({
      auditSubmissionId: input.auditSubmissionId,
      email: input.email,
      websiteUrl: input.websiteUrl,
      intent: "fix_plan_requested"
    });

    return {
      id: (cleanLead.data as { id: string }).id,
      table: "clientflow_fix_plan_requests"
    };
  }

  console.error("Supabase clean fix plan request insert failed; saving fallback audit row", cleanLead.error);

  const userId = await createStorageUser(input.email);
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("clientflow_website_audits")
    .insert({
      user_id: userId,
      website_url: input.websiteUrl,
      final_url: input.websiteUrl,
      host: getHost(input.websiteUrl),
      business_name: input.businessName,
      industry: "Fix plan request",
      issue_category: "Fix plan request",
      main_issue: input.mainIssue || "Visitor requested a fix plan.",
      analysis: requestPayload,
      scraped: {
        source: "fix_plan_request",
        websiteUrl: input.websiteUrl
      },
      scrape_warning: null
    })
    .select("id")
    .single();

  if (error) {
    console.error("Supabase fallback implementation request insert failed", error);
    return null;
  }

  return {
    id: (data as { id: string }).id,
    table: "clientflow_website_audits"
  };
}
