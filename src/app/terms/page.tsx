const sections = [
  {
    title: "1. Acceptance",
    body:
      "By accessing or using the Website Revenue Audit, you agree to these Terms. If you do not agree, do not use the audit or submit your information."
  },
  {
    title: "2. Audit Purpose",
    body:
      "The audit reviews public website information and provides general business observations about possible conversion gaps, booking gaps, follow-up gaps, trust gaps, and revenue leaks. The audit is informational and does not guarantee accuracy, revenue, bookings, leads, or business results."
  },
  {
    title: "3. Service Requests",
    body:
      "If you request help after an audit, we may contact you about implementation services such as booking system setup, reminders, missed-call recovery, follow-up, review generation, retention systems, or related backend setup. Any paid work requires separate agreement, scope, timing, and payment terms."
  },
  {
    title: "4. User Responsibility",
    body:
      "You are responsible for the website you submit, the accuracy of your contact information, business decisions you make, and compliance with laws that apply to your business, marketing, privacy, customer communication, and data handling."
  },
  {
    title: "5. No Professional Advice",
    body:
      "Audit results are not legal, financial, medical, accounting, tax, or professional advice. You should review recommendations with qualified advisors where needed before making business changes."
  },
  {
    title: "6. No Guaranteed Results",
    body:
      "We do not guarantee increased bookings, revenue, conversion rates, leads, reduced no-shows, customer retention, search rankings, or any other business outcome. Results depend on your market, offer, traffic, operations, budget, implementation, and follow-through."
  },
  {
    title: "7. Prohibited Use",
    body:
      "You may not use the audit for unlawful activity, spam, fraud, harassment, misleading claims, impersonation, scraping abuse, rights violations, security attacks, or any activity that harms the operator, users, prospects, or third parties."
  },
  {
    title: "8. Intellectual Property",
    body:
      "The audit format, design, copy, workflows, and related materials belong to the operator or licensors. You may use your generated report for internal evaluation of your own business, but you may not copy, resell, clone, or redistribute the system."
  },
  {
    title: "9. Third-Party Services",
    body:
      "The audit may rely on hosting, website scraping, analytics, database, and language model providers. We are not responsible for third-party outages, delays, policy decisions, data processing, or failures outside our control."
  },
  {
    title: "10. Disclaimer",
    body:
      "The audit and website are provided as is and as available, without warranties of any kind, express or implied, including accuracy, fitness for a particular purpose, merchantability, non-infringement, uninterrupted availability, or security."
  },
  {
    title: "11. Limitation of Liability",
    body:
      "To the fullest extent allowed by law, the operator will not be liable for indirect, incidental, special, consequential, exemplary, punitive, lost profit, lost revenue, lost data, business interruption, or lost opportunity damages. Total liability is limited to USD $50 or the amount you paid directly for a specific service, whichever is lower, unless mandatory law requires otherwise."
  },
  {
    title: "12. Indemnity",
    body:
      "You agree to defend, indemnify, and hold harmless the operator from claims, losses, liabilities, damages, costs, and expenses arising from your website submission, use of the audit, business decisions, legal compliance, customer communications, or breach of these Terms."
  },
  {
    title: "13. Changes",
    body:
      "We may update these Terms at any time. Continued use after changes means you accept the updated Terms."
  },
  {
    title: "14. Governing Law",
    body:
      "Unless mandatory local law requires otherwise, these Terms are governed by the laws of the jurisdiction where the operator is established, without regard to conflict of law rules."
  }
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#090A0D] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="text-sm font-bold text-[#D6B46A]">Back to audit</a>
        <h1 className="mt-8 text-4xl font-black">Terms and Conditions</h1>
        <p className="mt-4 text-sm leading-7 text-white/60">Last updated: May 1, 2026</p>
        <p className="mt-4 rounded-2xl border border-[#D6B46A]/25 bg-[#D6B46A]/10 p-4 text-sm leading-7 text-white/70">
          These terms are a protective template for the audit funnel. Have a qualified lawyer review them before paid scale.
        </p>
        <div className="mt-8 space-y-5">
          {sections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
              <h2 className="text-xl font-black">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/68">{section.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 text-sm text-white/55">
          Questions: <a className="text-[#D6B46A]" href="mailto:watpadetejas@gmail.com">watpadetejas@gmail.com</a>
        </p>
      </div>
    </main>
  );
}
