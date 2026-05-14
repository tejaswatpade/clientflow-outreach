const sections = [
  {
    title: "Information We Collect",
    items: [
      "Website URLs you submit for audit.",
      "Business type, optional email address, and contact details you submit through the implementation request form.",
      "Public information found on submitted websites, including visible business text, calls to action, phone numbers, email addresses, and page content.",
      "Generated audit results, revenue leak findings, fix plans, and implementation request details.",
      "Basic technical data such as cookies, browser information, logs, and usage activity."
    ]
  },
  {
    title: "How We Use Information",
    items: [
      "To generate website revenue audits and show conversion, booking, follow-up, and retention gaps.",
      "To contact you if you request help fixing the system behind your website.",
      "To operate the website, prevent abuse, improve reliability, and protect legal rights.",
      "To understand which audit requests turn into service opportunities."
    ]
  },
  {
    title: "Sharing",
    items: [
      "We do not sell personal information.",
      "We may share data with service providers that help run the audit, such as hosting, database, website analysis, and language model providers.",
      "We may disclose information if required by law, to prevent abuse, or to protect rights, safety, and security."
    ]
  },
  {
    title: "Security and Retention",
    items: [
      "We use reasonable safeguards for submitted information, but no system can be guaranteed perfectly secure.",
      "We keep information only as long as needed for audit delivery, service follow-up, support, legal, or security purposes.",
      "Submitted website information may include public contact information found on the audited website."
    ]
  },
  {
    title: "Your Choices",
    items: [
      "You can avoid submitting optional email or contact details.",
      "You can contact us to request help with privacy questions or deletion requests.",
      "You can clear cookies or browser data at any time."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#090A0D] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="text-sm font-bold text-[#D6B46A]">Back to audit</a>
        <h1 className="mt-8 text-4xl font-black">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-7 text-white/60">Last updated: May 1, 2026</p>
        <p className="mt-4 text-sm leading-7 text-white/68">
          This Privacy Policy explains how the Website Revenue Audit collects, uses, shares, and protects information.
        </p>
        <div className="mt-8 space-y-5">
          {sections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
              <h2 className="text-xl font-black">{section.title}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-white/68">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D6B46A]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-xl font-black">Children</h2>
          <p className="mt-3 text-sm leading-7 text-white/68">
            The audit is not intended for children under 13 and should not be used by anyone who cannot legally submit business information.
          </p>
        </section>
        <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-xl font-black">Contact</h2>
          <p className="mt-3 text-sm leading-7 text-white/68">
            Privacy questions can be sent to <a className="text-[#D6B46A]" href="mailto:watpadetejas@gmail.com">watpadetejas@gmail.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
