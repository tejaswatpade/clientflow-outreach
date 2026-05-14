import { NextResponse } from "next/server";
import { z } from "zod";
import { markAuditLeadIntent } from "@/lib/lead-system/supabase-store";

export const runtime = "nodejs";

const intentSchema = z.object({
  auditSubmissionId: z.string().uuid().optional().nullable(),
  email: z.string().email().optional(),
  websiteUrl: z.string().min(3).optional(),
  intent: z.enum(["pricing_clicked", "pricing_viewed", "fix_form_opened", "fix_plan_requested"])
});

export async function POST(request: Request) {
  try {
    const input = intentSchema.parse(await request.json());
    const auditSubmissionId = await markAuditLeadIntent(input);

    return NextResponse.json({
      ok: true,
      auditSubmissionId,
      leadStage: input.intent === "fix_plan_requested" ? "submitted" : "hot"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update lead intent";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
