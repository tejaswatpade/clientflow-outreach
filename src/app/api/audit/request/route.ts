import { NextResponse } from "next/server";
import { z } from "zod";
import { saveImplementationRequest } from "@/lib/lead-system/supabase-store";

export const runtime = "nodejs";

const requestSchema = z.object({
  auditSubmissionId: z.string().uuid().optional().nullable(),
  name: z.string().min(2),
  email: z.string().email(),
  countryCode: z.string().min(2),
  phone: z.string().min(5),
  businessName: z.string().min(2),
  websiteUrl: z.string().min(3),
  mainIssue: z.string().optional(),
  revenueLeakScore: z.number().optional(),
  sourcePlan: z.string().optional()
});

const disposableDomains = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "throwawaymail.com",
  "getnada.com",
  "sharklasers.com"
]);

function isDisposableEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return disposableDomains.has(domain);
}

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());

    if (isDisposableEmail(input.email)) {
      return NextResponse.json({ error: "Please use a business or personal email." }, { status: 400 });
    }

    const savedRequest = await saveImplementationRequest(input);

    return NextResponse.json({
      ok: true,
      requestId: savedRequest?.id ?? null,
      savedTo: savedRequest?.table ?? null,
      message: "Got it — we’ll review your audit and send you the best fix plan."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not submit request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
