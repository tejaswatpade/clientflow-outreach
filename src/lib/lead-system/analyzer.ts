import type { AnalyzeRevenueAuditInput, ScrapedWebsite, WebsiteRevenueAudit } from "./types";

const SYSTEM_PROMPT = `
You are a website revenue auditor for a client acquisition funnel.

Core business model:
- We are not selling software.
- We use the audit to diagnose revenue leaks and convert the business owner into a service client.
- The paid service is implementation: booking system fixes, conversion system fixes, reminders, missed-call recovery, follow-up, review generation, retention, and backend setup.

Positioning rules:
- Do not say AI tool.
- Do not say SaaS.
- Do not say outreach tool.
- Do not mention Gmail, login, subscriptions, pricing plans, or user accounts.
- Do not mention platform names.
- Use phrases like Revenue Audit, Booking System Fix, Conversion System, increase bookings, reduce no-shows, follow-up, missed leads, and revenue leaks.

Audit rules:
- This is not a generic SEO or design audit.
- Focus on conversion issues, booking gaps, missing systems, trust gaps, follow-up gaps, and revenue leaks.
- Also include neutral website audit categories: First Impression, Message Clarity, Offer Clarity, Trust Signals, Mobile Experience, and Speed Basics.
- Make the report feel like a real business diagnosis.
- Pick one clear main issue.
- Keep recommendations simple enough for a business owner to understand.
- Do not invent exact analytics, traffic, revenue, or client numbers.
- It is acceptable to use ranges like 15-30% or 20-40% when framed as potential improvement/loss.
- Avoid extreme claims. Use softer phrases like likely, may be losing, can help, and potential improvement.
- Balance the audit: include what is working, what may be costing bookings, and practical fixes that do not always require a paid implementation.

Output rules:
- Return exactly the requested JSON shape.
- The revenueLeakScore should be 0-100 where higher means more leakage/risk.
- estimatedLoss should be a short range phrase like "20-40% potential bookings lost".
- finalInsight should be close to: "Your website is not broken - your system behind it is missing."
`;

const auditSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "businessName",
    "businessType",
    "websiteUrl",
    "revenueLeakScore",
    "mainIssue",
    "estimatedLoss",
    "whatsWorking",
    "costingBookings",
    "nonServiceAudit",
    "revenueLeakBreakdown",
    "pageAnalysis",
    "missedRevenueOpportunities",
    "fixPlan",
    "impactProjection",
    "finalInsight"
  ],
  properties: {
    businessName: { type: "string" },
    businessType: { type: "string" },
    websiteUrl: { type: "string" },
    revenueLeakScore: { type: "number", minimum: 0, maximum: 100 },
    mainIssue: { type: "string" },
    estimatedLoss: { type: "string" },
    whatsWorking: { type: "array", minItems: 2, maxItems: 3, items: { type: "string" } },
    costingBookings: {
      type: "array",
      minItems: 4,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["issue", "whyItMatters", "suggestedFix"],
        properties: {
          issue: { type: "string" },
          whyItMatters: { type: "string" },
          suggestedFix: { type: "string" }
        }
      }
    },
    nonServiceAudit: {
      type: "array",
      minItems: 6,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "finding", "whyItMatters", "suggestedFix", "severity"],
        properties: {
          category: {
            type: "string",
            enum: ["First Impression", "Message Clarity", "Offer Clarity", "Trust Signals", "Mobile Experience", "Speed Basics"]
          },
          finding: { type: "string" },
          whyItMatters: { type: "string" },
          suggestedFix: { type: "string" },
          severity: { type: "string", enum: ["High", "Medium", "Low"] }
        }
      }
    },
    revenueLeakBreakdown: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["issueName", "severity", "explanation"],
        properties: {
          issueName: { type: "string" },
          severity: { type: "string", enum: ["High", "Medium", "Low"] },
          explanation: { type: "string" }
        }
      }
    },
    pageAnalysis: {
      type: "object",
      additionalProperties: false,
      required: ["homepage", "servicesPage", "contactPage"],
      properties: {
        homepage: {
          type: "object",
          additionalProperties: false,
          required: ["problem", "suggestedFix"],
          properties: {
            problem: { type: "string" },
            suggestedFix: { type: "string" }
          }
        },
        servicesPage: {
          type: "object",
          additionalProperties: false,
          required: ["problem", "suggestedFix"],
          properties: {
            problem: { type: "string" },
            suggestedFix: { type: "string" }
          }
        },
        contactPage: {
          type: "object",
          additionalProperties: false,
          required: ["problem", "suggestedFix"],
          properties: {
            problem: { type: "string" },
            suggestedFix: { type: "string" }
          }
        }
      }
    },
    missedRevenueOpportunities: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "currentState", "improvedState", "impact"],
        properties: {
          title: { type: "string" },
          currentState: { type: "string" },
          improvedState: { type: "string" },
          impact: { type: "string" }
        }
      }
    },
    fixPlan: { type: "array", minItems: 4, maxItems: 5, items: { type: "string" } },
    impactProjection: {
      type: "object",
      additionalProperties: false,
      required: ["currentFunnel", "improvedScenario", "projectedGain"],
      properties: {
        currentFunnel: { type: "string" },
        improvedScenario: { type: "string" },
        projectedGain: { type: "string" }
      }
    },
    finalInsight: { type: "string" }
  }
};

function getOutputText(response: unknown) {
  const data = response as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
  };

  if (data.output_text) {
    return data.output_text;
  }

  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((item) => item.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

function parseJsonObject(value: string) {
  const cleaned = value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(cleaned) as WebsiteRevenueAudit;
}

function businessNameFromScrape(scrape: ScrapedWebsite) {
  const fromTitle = scrape.title
    .split(/[|-]/)[0]
    .replace(/\b(home|official site|welcome)\b/gi, "")
    .trim();

  if (fromTitle.length >= 3 && fromTitle.length <= 70) {
    return fromTitle;
  }

  return scrape.host
    .split(".")
    .filter(Boolean)
    .slice(0, 2)
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function scoreFromScrape(scrape: ScrapedWebsite) {
  const text = `${scrape.title} ${scrape.description} ${scrape.headings.join(" ")} ${scrape.text}`.toLowerCase();
  const hasBookingCta = scrape.ctas.some((cta) => /book|schedule|appointment|consult|quote|estimate|reserve|call|contact/i.test(cta));
  const hasProof = /review|testimonial|case stud|before and after|portfolio|trusted|stars|rating/.test(text);
  const hasFollowUp = /follow up|callback|call back|newsletter|sms|text|reminder|membership|loyalty/.test(text);
  const hasContactPath = scrape.formCount > 0 || scrape.emails.length > 0 || scrape.phones.length > 0;

  let score = 42;
  if (!hasBookingCta) score += 18;
  if (!hasProof) score += 14;
  if (!hasFollowUp) score += 12;
  if (!hasContactPath) score += 12;
  if (scrape.text.length < 900) score += 8;

  return Math.max(35, Math.min(91, score));
}

function fallbackAudit(scrape: ScrapedWebsite, input: AnalyzeRevenueAuditInput): WebsiteRevenueAudit {
  const businessName = businessNameFromScrape(scrape);
  const score = scoreFromScrape(scrape);
  const hasCta = scrape.ctas.some((cta) => /book|schedule|appointment|consult|quote|estimate|reserve|call|contact/i.test(cta));
  const hasContactPath = scrape.formCount > 0 || scrape.emails.length > 0 || scrape.phones.length > 0;
  const mainIssue = hasCta
    ? "The website creates interest, but the system after that interest is not clear enough."
    : "The website does not make the next booking or inquiry step clear enough.";

  return {
    businessName,
    businessType: input.businessType || "Other local business",
    websiteUrl: scrape.finalUrl,
    revenueLeakScore: score,
    mainIssue,
    estimatedLoss: "20-40% potential bookings lost",
    whatsWorking: [
      scrape.title ? `The brand is visible through the page title: ${scrape.title}.` : "The website gives visitors a clear business identity.",
      scrape.description ? "The page explains the business enough for a visitor to understand the offer." : "The website provides enough public context to start a revenue audit.",
      scrape.ctas.length ? "There are already action points that can be strengthened." : "The site has room for a stronger conversion path."
    ].slice(0, 3),
    costingBookings: [
      {
        issue: hasCta ? "The main action is present but could be clearer." : "The main call to action is not clear enough for high-intent visitors.",
        whyItMatters: "Visitors may hesitate or move on if the next step is not obvious.",
        suggestedFix: "Use one primary action above the fold, such as booking, calling, requesting a quote, or starting an enquiry."
      },
      {
        issue: hasContactPath ? "The contact path exists but does not explain what happens next." : "A clear contact or booking path was not detected.",
        whyItMatters: "People are more likely to enquire when they know how quickly they will hear back and what the process looks like.",
        suggestedFix: "Add a short expectation near the form or phone number, such as response time and next step."
      },
      {
        issue: "There is no visible follow-up path for interested visitors.",
        whyItMatters: "Some visitors are interested but not ready to act immediately, so they may be losing momentum.",
        suggestedFix: "Add a simple lead capture option and a gentle follow-up sequence after enquiries."
      },
      {
        issue: "Trust signals could be stronger near decision points.",
        whyItMatters: "Visitors often need proof before booking, calling, or submitting their details.",
        suggestedFix: "Place recent reviews, outcomes, guarantees, or proof near the main CTA and service sections."
      }
    ],
    nonServiceAudit: [
      {
        category: "First Impression",
        finding: "The website gives enough context to understand the business, but the first screen could work harder.",
        whyItMatters: "A stronger first impression can reduce bounce and help visitors decide faster.",
        suggestedFix: "Make the main result, audience, and next step visible immediately.",
        severity: "Medium"
      },
      {
        category: "Message Clarity",
        finding: "The message may require visitors to piece together the value themselves.",
        whyItMatters: "Clear messaging helps visitors quickly understand why they should choose this business.",
        suggestedFix: "Use a direct headline that explains the outcome customers get.",
        severity: "Medium"
      },
      {
        category: "Offer Clarity",
        finding: "The offer could be packaged more clearly around the visitor's problem.",
        whyItMatters: "Clear offers make it easier for visitors to act without comparing every detail.",
        suggestedFix: "Group services into simple packages or clear next-step options.",
        severity: "Medium"
      },
      {
        category: "Trust Signals",
        finding: "Proof and reassurance could be more visible before the main action.",
        whyItMatters: "Reviews and proof can reduce hesitation and increase enquiry quality.",
        suggestedFix: "Add testimonials, ratings, examples, certifications, or client outcomes close to CTAs.",
        severity: "High"
      },
      {
        category: "Mobile Experience",
        finding: "The mobile path should be checked for CTA visibility and simple scrolling.",
        whyItMatters: "Many visitors may see the site on mobile before calling or booking.",
        suggestedFix: "Keep the primary CTA visible, make tap targets clear, and reduce unnecessary steps.",
        severity: "Medium"
      },
      {
        category: "Speed Basics",
        finding: "The audit cannot fully measure speed here, but the page should stay lightweight and quick.",
        whyItMatters: "Slow pages can cause potential customers to leave before reading the offer.",
        suggestedFix: "Compress large images, reduce heavy scripts, and keep above-the-fold content fast.",
        severity: "Low"
      }
    ],
    revenueLeakBreakdown: [
      {
        issueName: "Weak CTA",
        severity: hasCta ? "Medium" : "High",
        explanation: "Visitors need one obvious next step instead of having to decide what to do."
      },
      {
        issueName: "No visible booking system",
        severity: "High",
        explanation: "High-intent visitors can leave if the booking, quote, or consultation path is not instant."
      },
      {
        issueName: "No follow-up path",
        severity: "High",
        explanation: "Leads who do not act immediately can disappear without reminders or follow-up."
      },
      {
        issueName: "Weak trust loop",
        severity: "Medium",
        explanation: "More reviews, proof, and recent outcomes would reduce hesitation before booking."
      }
    ],
    pageAnalysis: {
      homepage: {
        problem: "The homepage does not push one clear revenue action hard enough.",
        suggestedFix: "Add a direct booking, quote, or consultation CTA above the fold with a simple reason to act now."
      },
      servicesPage: {
        problem: "Service interest is not connected to a strong next step.",
        suggestedFix: "Attach each key service to a booking, quote, or lead capture path with short proof points."
      },
      contactPage: {
        problem: "Contact alone does not guarantee follow-up or conversion.",
        suggestedFix: "Add a short form, fast response promise, missed-call text-back, and follow-up sequence."
      }
    },
    missedRevenueOpportunities: [
      {
        title: "Booking system missing",
      currentState: "Visitors may have to work too hard to become a booked lead.",
        improvedState: "Visitors get one clear booking or quote path.",
        impact: "More high-intent visitors take action before leaving."
      },
      {
        title: "No follow-up system",
      currentState: "Interested leads may go cold after the first visit or first call.",
        improvedState: "Every inquiry gets reminders and follow-up until the next step is complete.",
        impact: "More leads turn into booked calls, appointments, or customers."
      },
      {
        title: "No retention system",
        currentState: "Past visitors and customers are not clearly brought back.",
        improvedState: "Reviews, reactivation, and repeat-client prompts create another revenue path.",
        impact: "More repeat business without needing more website traffic."
      }
    ],
    fixPlan: [
      "Add one clear CTA above the fold.",
      "Add a booking, quote, or consultation system.",
      "Add lead capture for visitors who are not ready to call.",
      "Add follow-up for forms, calls, and missed inquiries.",
      "Add proof, reviews, and trust signals near every CTA."
    ],
    impactProjection: {
      currentFunnel: "Visitors -> unclear next step -> some inquiries leave without action.",
      improvedScenario: "Visitors -> clear CTA -> booked inquiry -> follow-up -> more completed bookings.",
      projectedGain: "You could gain 15-30% more bookings by fixing these system gaps."
    },
    finalInsight: "Your website is not broken - your system behind it is missing."
  };
}

export async function analyzeRevenueAudit(
  scrape: ScrapedWebsite,
  input: AnalyzeRevenueAuditInput
): Promise<WebsiteRevenueAudit> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKey) {
    return fallbackAudit(scrape, input);
  }

  const userPrompt = {
    businessType: input.businessType,
    reportEmail: input.reportEmail || "",
    website: scrape
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: SYSTEM_PROMPT }]
          },
          {
            role: "user",
            content: [{ type: "input_text", text: JSON.stringify(userPrompt) }]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "website_revenue_audit",
            schema: auditSchema,
            strict: true
          }
        },
        temperature: 0.35,
        max_output_tokens: 3600
      })
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`OpenAI request failed: ${message}`);
    }

    const data = await response.json();
    const text = getOutputText(data);
    const parsed = parseJsonObject(text);

    return {
      ...parsed,
      websiteUrl: parsed.websiteUrl || scrape.finalUrl,
      revenueLeakScore: Math.max(0, Math.min(100, Math.round(parsed.revenueLeakScore)))
    };
  } catch (error) {
    console.error(error);
    return fallbackAudit(scrape, input);
  }
}
