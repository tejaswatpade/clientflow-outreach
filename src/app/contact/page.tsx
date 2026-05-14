export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#090A0D] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm font-bold text-[#D6B46A]">Back to audit</a>
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.05] p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D6B46A]">Contact</p>
          <h1 className="mt-3 text-4xl font-black">Need help fixing your booking system?</h1>
          <p className="mt-4 text-sm leading-7 text-white/68">
            For audit questions, implementation requests, booking system fixes, follow-up systems, retention setup, or privacy questions, contact:
          </p>
          <a
            href="mailto:watpadetejas@gmail.com"
            className="mt-6 inline-flex rounded-2xl bg-[#D6B46A] px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-[#090A0D]"
          >
            watpadetejas@gmail.com
          </a>
          <p className="mt-6 text-xs leading-6 text-white/45">
            The audit is used to diagnose revenue leaks and start a service conversation. Response times may vary during MVP testing.
          </p>
        </div>
      </div>
    </main>
  );
}
