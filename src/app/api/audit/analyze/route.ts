import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeRevenueAudit } from "@/lib/lead-system/analyzer";
import { scrapeWebsite } from "@/lib/lead-system/scrape";
import { saveRevenueAudit } from "@/lib/lead-system/supabase-store";
import type { ScrapedWebsite } from "@/lib/lead-system/types";

export const runtime = "nodejs";

const analyzeSchema = z.object({
  websiteUrl: z.string().min(3),
  businessType: z.string().min(2),
  reportEmail: z.string().email()
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

function fallbackScrape(websiteUrl: string, message: string): ScrapedWebsite {
  const withProtocol = /^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`;
  const url = new URL(withProtocol);

  return {
    url: url.toString(),
    finalUrl: url.toString(),
    host: url.host.replace(/^www\./, ""),
    title: url.host.replace(/^www\./, ""),
    description: "",
    headings: [],
    ctas: [],
    emails: [],
    phones: [],
    socialLinks: [],
    formCount: 0,
    text: `The website could not be fully scraped. Reason: ${message}`
  };
}

export async function POST(request: Request) {
  try {
    const input = analyzeSchema.parse(await request.json());

    if (isDisposableEmail(input.reportEmail)) {
      return NextResponse.json({ error: "Please use a business or personal email to receive your audit." }, { status: 400 });
    }
    let scrapeWarning = "";
    let scraped: ScrapedWebsite;

    try {
      scraped = await scrapeWebsite(input.websiteUrl);
    } catch (error) {
      scrapeWarning = error instanceof Error ? error.message : "Website scrape failed";
      scraped = fallbackScrape(input.websiteUrl, scrapeWarning);
    }

    const audit = await analyzeRevenueAudit(scraped, input);
    const savedAudit = await saveRevenueAudit({
      audit,
      scraped,
      scrapeWarning,
      reportEmail: input.reportEmail
    });

    return NextResponse.json({
      auditId: savedAudit?.auditId ?? null,
      auditSubmissionId: savedAudit?.auditSubmissionId ?? null,
      savedTo: savedAudit?.savedTo ?? [],
      audit,
      scraped,
      scrapeWarning
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not analyze website";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
