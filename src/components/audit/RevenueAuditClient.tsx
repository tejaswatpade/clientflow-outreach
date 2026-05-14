"use client";

import { type FormEvent, useEffect, useState } from "react";
import type { BusinessType, ScrapedWebsite, WebsiteRevenueAudit } from "@/lib/lead-system/types";
import { FixPlanModal } from "./FixPlanModal";
import { getEmailError } from "./emailValidation";

type AnalyzeResponse = {
  auditId?: string | null;
  auditSubmissionId?: string | null;
  audit: WebsiteRevenueAudit;
  scraped: ScrapedWebsite;
  scrapeWarning?: string;
  savedTo?: string[];
  error?: string;
};

const businessTypes: BusinessType[] = [
  "Med spa",
  "Clinic / healthcare",
  "Dental",
  "Salon / beauty",
  "Fitness / gym",
  "Home services",
  "Legal",
  "Real estate",
  "Restaurant",
  "Auto repair",
  "B2B service",
  "Ecommerce",
  "Other local business"
];

const scanSteps = ["Reading website", "Checking booking path", "Finding revenue leaks", "Building report"];

function shortHost(value: string) {
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).host.replace(/^www\./, "");
  } catch {
    return value || "your website";
  }
}

function SeverityBadge({ severity }: { severity: string }) {
  const color =
    severity === "High"
      ? "border-red-300/30 bg-red-300/10 text-red-100"
      : severity === "Medium"
        ? "border-[#D6B46A]/35 bg-[#D6B46A]/10 text-[#F4D98F]"
        : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";

  return <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${color}`}>{severity}</span>;
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
      <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#D6B46A]">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-white/76">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D6B46A]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BookingCostList({ audit }: { audit: WebsiteRevenueAudit }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
      <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#D6B46A]">What&apos;s Costing You Bookings</h3>
      <div className="mt-4 space-y-3">
        {audit.costingBookings.map((item) => (
          <article key={item.issue} className="rounded-2xl border border-white/10 bg-[#0F1115] p-4">
            <h4 className="text-sm font-black text-white">{item.issue}</h4>
            <p className="mt-2 text-sm leading-6 text-white/62">{item.whyItMatters}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#F4D98F]">{item.suggestedFix}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function QuickWinsCard({ audit }: { audit: WebsiteRevenueAudit }) {
  const quickWins = [
    ...audit.nonServiceAudit.slice(0, 2).map((item) => ({
      label: item.category,
      text: item.suggestedFix
    })),
    ...audit.fixPlan.slice(0, 2).map((item, index) => ({
      label: index === 0 ? "First fix" : "Next fix",
      text: item
    }))
  ].filter((item) => item.text.trim()).slice(0, 4);

  return (
    <section className="rounded-2xl border border-[#D6B46A]/20 bg-[#D6B46A]/[0.07] p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D6B46A]">Quick Wins</p>
      <h3 className="mt-3 text-xl font-black text-white">Small fixes worth testing first</h3>
      <div className="mt-4 space-y-3">
        {quickWins.map((item, index) => (
          <article key={`${item.label}-${item.text}-${index}`} className="rounded-2xl border border-white/10 bg-[#0F1115] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/42">{item.label}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/76">{item.text}</p>
          </article>
        ))}
      </div>
      <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white/62">
        These are practical improvements to try before making bigger changes to the full booking system.
      </p>
    </section>
  );
}

function PageFixBlock({ title, problem, suggestedFix }: { title: string; problem: string; suggestedFix: string }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0F1115] p-5">
      <h3 className="text-lg font-black text-white">{title}</h3>
      <div className="mt-4 space-y-4 text-sm leading-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Problem</p>
          <p className="mt-2 text-white/72">{problem}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#D6B46A]">Suggested fix</p>
          <p className="mt-2 text-white/78">{suggestedFix}</p>
        </div>
      </div>
    </section>
  );
}

export function RevenueAuditClient() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("Med spa");
  const [reportEmail, setReportEmail] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanIndex, setScanIndex] = useState(0);
  const [error, setError] = useState("");
  const [isFixModalOpen, setIsFixModalOpen] = useState(false);

  useEffect(() => {
    if (!isAnalyzing) {
      setScanIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setScanIndex((current) => (current + 1) % scanSteps.length);
    }, 850);

    return () => window.clearInterval(timer);
  }, [isAnalyzing]);

  function trackLeadIntent(intent: "pricing_clicked" | "fix_form_opened") {
    const payload = {
      auditSubmissionId: result?.auditSubmissionId ?? null,
      email: reportEmail || undefined,
      websiteUrl: audit?.websiteUrl || websiteUrl || undefined,
      intent
    };

    if (!payload.auditSubmissionId && (!payload.email || !payload.websiteUrl)) {
      return;
    }

    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/audit/intent", new Blob([body], { type: "application/json" }));
      return;
    }

    void fetch("/api/audit/intent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true
    });
  }

  function openFixForm() {
    trackLeadIntent("fix_form_opened");
    setIsFixModalOpen(true);
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    const emailError = getEmailError(reportEmail);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/audit/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          websiteUrl,
          businessType,
          reportEmail
        })
      });
      const data = (await response.json()) as AnalyzeResponse;

      if (!response.ok) {
        throw new Error(data.error || "Could not analyze website");
      }

      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not analyze website");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const audit = result?.audit;
  const reportTitle = audit?.businessName || shortHost(websiteUrl);
  const pricingParams = new URLSearchParams();
  if (audit?.websiteUrl || websiteUrl) pricingParams.set("website", audit?.websiteUrl || websiteUrl);
  if (audit?.businessName) pricingParams.set("businessName", audit.businessName);
  if (reportEmail) pricingParams.set("email", reportEmail);
  if (audit?.mainIssue) pricingParams.set("mainIssue", audit.mainIssue);
  if (typeof audit?.revenueLeakScore === "number") pricingParams.set("score", String(audit.revenueLeakScore));
  if (result?.auditSubmissionId) pricingParams.set("auditSubmissionId", result.auditSubmissionId);
  const pricingHref = `/pricing${pricingParams.toString() ? `?${pricingParams.toString()}` : ""}`;

  return (
    <main className="min-h-screen bg-[#090A0D] text-white">
      <header className="border-b border-white/10 bg-[#090A0D]/92 backdrop-blur-xl">
        <nav className="mx-auto flex h-[72px] w-full max-w-[1180px] items-center justify-between px-4 sm:px-6">
          <button type="button" onClick={() => setResult(null)} className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#D6B46A] text-sm font-black text-[#090A0D]">RA</span>
            <span className="text-base font-black tracking-wide">Revenue Audit</span>
          </button>
          <div className="flex items-center gap-4 text-sm font-bold text-white/62">
            <a href="/contact" className="transition hover:text-white">Contact</a>
            {audit ? (
              <button type="button" onClick={openFixForm} className="rounded-full bg-[#D6B46A] px-5 py-2.5 text-sm font-black text-[#090A0D]">
                Fix These Leaks For Me
              </button>
            ) : null}
          </div>
        </nav>
      </header>

      {!audit ? (
        <>
          <section className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-[54fr_46fr] lg:pb-20 lg:pt-20">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D6B46A]">Website Revenue Audit</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.03] tracking-normal text-white sm:text-6xl">
                Find Out How Your Website Is Losing Clients Every Day
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
                Get a clear diagnosis of booking gaps, conversion leaks, missing follow-up, and the systems costing you clients.
              </p>

              <form onSubmit={handleAnalyze} className="mt-8 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/30">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="text-sm font-black text-white">Website URL</span>
                    <input
                      value={websiteUrl}
                      onChange={(event) => setWebsiteUrl(event.target.value)}
                      required
                      placeholder="https://example.com"
                      className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0D0F13] px-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-[#D6B46A]"
                    />
                  </label>
                  <label>
                    <span className="text-sm font-black text-white">Business Type</span>
                    <select
                      value={businessType}
                      onChange={(event) => setBusinessType(event.target.value as BusinessType)}
                      className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0D0F13] px-4 text-sm font-semibold text-white outline-none focus:border-[#D6B46A]"
                    >
                      {businessTypes.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="text-sm font-black text-white">Email to receive your audit</span>
                    <input
                      value={reportEmail}
                      onChange={(event) => setReportEmail(event.target.value)}
                      required
                      type="email"
                      placeholder="you@business.com"
                      className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0D0F13] px-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-[#D6B46A]"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="mt-4 h-14 w-full rounded-xl bg-[#D6B46A] text-sm font-black uppercase tracking-[0.14em] text-[#090A0D] transition hover:bg-[#F4D98F] disabled:cursor-not-allowed disabled:bg-[#8e7a4a]"
                >
                  {isAnalyzing ? scanSteps[scanIndex] : "Analyze My Website"}
                </button>
              </form>

              {error ? <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100">{error}</p> : null}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/35">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D6B46A]">Sample report</p>
                  <h2 className="mt-2 text-2xl font-black">Revenue Leak Score</h2>
                </div>
                <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[#D6B46A]/40 bg-[#D6B46A]/15 text-xl font-black text-[#F4D98F]">
                  78
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {["Weak CTA", "No booking system", "No follow-up", "No retention system"].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0D0F13] px-4 py-3">
                    <span className="text-sm font-semibold text-white/82">{item}</span>
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-[#D6B46A]">Leak</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 rounded-2xl border border-[#D6B46A]/25 bg-[#D6B46A]/10 p-4 text-sm font-semibold leading-6 text-white/82">
                Your website is not broken - your system behind it is missing.
              </p>
            </div>
          </section>

          <section className="border-y border-white/10 bg-white/[0.03]">
            <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-4 px-4 py-10 sm:px-6 lg:grid-cols-3">
              {[
                ["Diagnose revenue leaks", "Find the exact booking, conversion, trust, and follow-up gaps costing clients."],
                ["Show the fix", "Turn the audit into a practical fix plan a business owner can understand immediately."],
                ["Convert into service work", "Use the report to offer booking systems, reminders, follow-up, and retention setup."]
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-[#101218] p-6">
                  <h2 className="text-xl font-black">{title}</h2>
                  <p className="mt-3 text-sm leading-7 text-white/62">{copy}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
          {result?.scrapeWarning ? (
            <p className="mb-5 rounded-2xl border border-[#D6B46A]/25 bg-[#D6B46A]/10 px-4 py-3 text-sm font-semibold text-[#F4D98F]">
              Scrape note: {result.scrapeWarning}
            </p>
          ) : null}

          <div className="rounded-[28px] border border-[#D6B46A]/25 bg-[#D6B46A]/10 p-6 shadow-2xl shadow-black/30 lg:p-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_220px] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#F4D98F]">Website Revenue Audit</p>
                <h1 className="mt-3 text-3xl font-black text-white sm:text-5xl">{reportTitle}</h1>
                <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-white/82">
                  Main Issue Identified: {audit.mainIssue}
                </p>
                <p className="mt-3 text-sm font-black uppercase tracking-[0.16em] text-white/58">
                  Estimated Loss: {audit.estimatedLoss}
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#090A0D]/70 p-5 text-center">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">Revenue Leak Score</p>
                <p className="mt-2 text-5xl font-black text-[#F4D98F]">{audit.revenueLeakScore}</p>
                <p className="mt-1 text-sm font-black text-white/55">/ 100</p>
              </div>
            </div>
            <button
              type="button"
              onClick={openFixForm}
              className="mt-6 h-12 rounded-xl bg-[#D6B46A] px-6 text-sm font-black uppercase tracking-[0.14em] text-[#090A0D] transition hover:bg-[#F4D98F]"
            >
              Fix These Leaks For Me
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            <div className="space-y-5">
              <BulletList title={"What's Working"} items={audit.whatsWorking} />
              <QuickWinsCard audit={audit} />
            </div>
            <BookingCostList audit={audit} />
          </div>

          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-2xl font-black">Website Experience Check</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {audit.nonServiceAudit.map((item) => (
                <article key={item.category} className="rounded-2xl border border-white/10 bg-[#0F1115] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-black text-white">{item.category}</h3>
                    <SeverityBadge severity={item.severity} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/72">{item.finding}</p>
                  <p className="mt-3 text-sm leading-6 text-white/55">{item.whyItMatters}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#F4D98F]">{item.suggestedFix}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-2xl font-black">Revenue Leak Breakdown</h2>
            <div className="mt-5 space-y-3">
              {audit.revenueLeakBreakdown.map((item) => (
                <div key={item.issueName} className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-[#0F1115] p-4 md:grid-cols-[220px_130px_1fr] md:items-center">
                  <h3 className="text-base font-black text-white">{item.issueName}</h3>
                  <SeverityBadge severity={item.severity} />
                  <p className="text-sm leading-6 text-white/68">{item.explanation}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-2xl font-black">Page-Level Analysis</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <PageFixBlock title="Homepage" problem={audit.pageAnalysis.homepage.problem} suggestedFix={audit.pageAnalysis.homepage.suggestedFix} />
              <PageFixBlock title="Services Page" problem={audit.pageAnalysis.servicesPage.problem} suggestedFix={audit.pageAnalysis.servicesPage.suggestedFix} />
              <PageFixBlock title="Contact Page" problem={audit.pageAnalysis.contactPage.problem} suggestedFix={audit.pageAnalysis.contactPage.suggestedFix} />
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-2xl font-black">Missed Revenue Opportunities</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {audit.missedRevenueOpportunities.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-[#0F1115] p-5">
                  <h3 className="text-lg font-black">{item.title}</h3>
                  <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-white/40">Current state</p>
                  <p className="mt-2 text-sm leading-6 text-white/65">{item.currentState}</p>
                  <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[#D6B46A]">Improved state</p>
                  <p className="mt-2 text-sm leading-6 text-white/72">{item.improvedState}</p>
                  <p className="mt-4 text-sm font-semibold leading-6 text-[#F4D98F]">{item.impact}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[45fr_55fr]">
            <BulletList title="Fix Plan" items={audit.fixPlan} />
            <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
              <h2 className="text-2xl font-black">Impact Projection</h2>
              <div className="mt-5 space-y-4 text-sm leading-7">
                <p><span className="font-black text-white">Current:</span> <span className="text-white/68">{audit.impactProjection.currentFunnel}</span></p>
                <p><span className="font-black text-white">Improved:</span> <span className="text-white/68">{audit.impactProjection.improvedScenario}</span></p>
                <p className="rounded-2xl border border-[#D6B46A]/25 bg-[#D6B46A]/10 p-4 font-black text-[#F4D98F]">
                  {audit.impactProjection.projectedGain}
                </p>
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-[28px] border border-[#D6B46A]/25 bg-[#D6B46A]/10 p-6 text-center">
            <h2 className="text-2xl font-black text-white">Your website is not broken — the system behind it is missing.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/68">
              Fixing a few key gaps can help turn more visitors into real enquiries.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={openFixForm} className="h-12 rounded-xl bg-[#D6B46A] px-6 text-sm font-black uppercase tracking-[0.14em] text-[#090A0D]">
                Fix These Leaks For Me
              </button>
              <a
                href={pricingHref}
                onClick={() => trackLeadIntent("pricing_clicked")}
                className="grid h-12 place-items-center rounded-xl border border-[#D6B46A]/40 px-6 text-sm font-black uppercase tracking-[0.14em] text-[#F4D98F]"
              >
                See Fix Plan & Pricing
              </a>
            </div>
          </section>

          <button
            type="button"
            onClick={() => {
              setResult(null);
              setWebsiteUrl("");
              setIsFixModalOpen(false);
            }}
            className="mt-6 h-12 rounded-xl border border-white/12 px-5 text-sm font-black uppercase tracking-[0.14em] text-white/70"
          >
            Run Another Audit
          </button>
        </section>
      )}

      <footer className="border-t border-white/10 px-4 py-8 text-sm text-white/45 sm:px-6">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>Website Revenue Audit</p>
          <div className="flex gap-5">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
      </footer>
      <FixPlanModal
        isOpen={isFixModalOpen}
        onClose={() => setIsFixModalOpen(false)}
        initialEmail={reportEmail}
        initialBusinessName={audit?.businessName || ""}
        initialWebsite={audit?.websiteUrl || websiteUrl}
        auditSubmissionId={result?.auditSubmissionId ?? null}
        mainIssue={audit?.mainIssue}
        revenueLeakScore={audit?.revenueLeakScore}
        sourcePlan="Audit result"
      />
    </main>
  );
}
