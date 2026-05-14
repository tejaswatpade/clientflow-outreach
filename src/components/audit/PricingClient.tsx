"use client";

import { useEffect, useState } from "react";
import { FixPlanModal } from "./FixPlanModal";

type PricingClientProps = {
  auditSubmissionId?: string;
  initialEmail?: string;
  initialBusinessName?: string;
  initialWebsite?: string;
  mainIssue?: string;
  revenueLeakScore?: number;
};

const plans = [
  {
    name: "Quick Fix",
    description: "For businesses that need the obvious conversion leaks cleaned up first.",
    items: ["CTA and page copy improvements", "Basic trust signal placement", "Contact path cleanup"],
    highlighted: false
  },
  {
    name: "Full System",
    description: "For businesses that want the website and follow-up system working together.",
    items: ["Booking or enquiry system", "Follow-up flow", "Reminders", "Missed lead recovery"],
    highlighted: true
  },
  {
    name: "Ongoing Growth",
    description: "For businesses that want the system monitored and improved over time.",
    items: ["Monthly optimisation", "Review and retention improvements", "Support and reporting"],
    highlighted: false
  }
];

export function PricingClient({
  auditSubmissionId = "",
  initialEmail = "",
  initialBusinessName = "",
  initialWebsite = "",
  mainIssue = "",
  revenueLeakScore
}: PricingClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourcePlan, setSourcePlan] = useState("");

  function trackLeadIntent(intent: "pricing_viewed" | "fix_form_opened") {
    const payload = {
      auditSubmissionId: auditSubmissionId || null,
      email: initialEmail || undefined,
      websiteUrl: initialWebsite || undefined,
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

  useEffect(() => {
    trackLeadIntent("pricing_viewed");
    // Pricing view should be captured once when this page loads from an audit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openPlan(planName: string) {
    trackLeadIntent("fix_form_opened");
    setSourcePlan(planName);
    setIsModalOpen(true);
  }

  return (
    <main className="min-h-screen bg-[#090A0D] text-white">
      <header className="border-b border-white/10 bg-[#090A0D]/92 backdrop-blur-xl">
        <nav className="mx-auto flex h-[72px] w-full max-w-[1180px] items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#D6B46A] text-sm font-black text-[#090A0D]">RA</span>
            <span className="text-base font-black tracking-wide">Revenue Audit</span>
          </a>
          <a href="/" className="text-sm font-bold text-white/62 transition hover:text-white">Run audit</a>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-[1180px] px-4 py-16 sm:px-6 lg:py-20">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D6B46A]">Fix plan options</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.03] tracking-normal text-white sm:text-6xl">
          Fix the leaks your audit found
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
          Choose the level of help that matches the gaps in your audit. No hard pricing here because the right scope depends on the website,
          business type, and systems already in place.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <section
              key={plan.name}
              className={`rounded-3xl border p-6 ${
                plan.highlighted
                  ? "border-[#D6B46A]/35 bg-[#D6B46A]/10 shadow-2xl shadow-black/25"
                  : "border-white/10 bg-white/[0.045]"
              }`}
            >
              {plan.highlighted ? (
                <p className="mb-4 inline-flex rounded-full border border-[#D6B46A]/30 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#F4D98F]">
                  Recommended
                </p>
              ) : null}
              <h2 className="text-2xl font-black">{plan.name}</h2>
              <p className="mt-3 text-sm leading-7 text-white/62">{plan.description}</p>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-white/74">
                {plan.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D6B46A]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => openPlan(plan.name)}
                className={`mt-7 h-12 w-full rounded-xl px-5 text-sm font-black uppercase tracking-[0.14em] ${
                  plan.highlighted
                    ? "bg-[#D6B46A] text-[#090A0D] hover:bg-[#F4D98F]"
                    : "border border-[#D6B46A]/35 text-[#F4D98F] hover:border-[#D6B46A]/70"
                }`}
              >
                Request My Fix Plan
              </button>
            </section>
          ))}
        </div>
      </section>

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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        auditSubmissionId={auditSubmissionId || null}
        initialEmail={initialEmail}
        initialBusinessName={initialBusinessName}
        initialWebsite={initialWebsite}
        mainIssue={mainIssue}
        revenueLeakScore={revenueLeakScore}
        sourcePlan={sourcePlan}
      />
    </main>
  );
}
