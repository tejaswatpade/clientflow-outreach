"use client";

import { type FormEvent, useEffect, useState } from "react";
import { getEmailError } from "./emailValidation";

const countryCodes = [
  { label: "US +1", value: "+1" },
  { label: "IN +91", value: "+91" },
  { label: "UK +44", value: "+44" },
  { label: "CA +1", value: "+1" },
  { label: "AU +61", value: "+61" },
  { label: "AE +971", value: "+971" }
];

type FixPlanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  initialBusinessName?: string;
  initialWebsite?: string;
  auditSubmissionId?: string | null;
  mainIssue?: string;
  revenueLeakScore?: number;
  sourcePlan?: string;
};

export function FixPlanModal({
  isOpen,
  onClose,
  initialEmail = "",
  initialBusinessName = "",
  initialWebsite = "",
  auditSubmissionId = null,
  mainIssue = "",
  revenueLeakScore,
  sourcePlan = ""
}: FixPlanModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsite);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setEmail(initialEmail);
    setBusinessName(initialBusinessName);
    setWebsiteUrl(initialWebsite);
    setMessage("");
    setError("");
  }, [initialBusinessName, initialEmail, initialWebsite, isOpen]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const emailError = getEmailError(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    if (!name.trim() || !phone.trim() || !businessName.trim() || !websiteUrl.trim()) {
      setError("Name, phone, business name, and website are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/audit/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          auditSubmissionId,
          name,
          email,
          countryCode,
          phone,
          businessName,
          websiteUrl,
          mainIssue,
          revenueLeakScore,
          sourcePlan
        })
      });
      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Could not submit request");
      }

      setMessage("Got it — we’ll review your audit and send you the best fix plan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit request");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/72 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#101218] p-6 shadow-2xl shadow-black/60">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D6B46A]">Fix plan request</p>
            <h2 className="mt-3 text-3xl font-black text-white">Request My Fix Plan</h2>
            <p className="mt-3 text-sm leading-7 text-white/65">
              We will review the audit and send the best practical fix plan for the leaks found.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-3 py-1 text-sm font-black text-white/60">
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label>
            <span className="text-sm font-black text-white">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="Your name"
              className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0D0F13] px-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-[#D6B46A]"
            />
          </label>
          <label>
            <span className="text-sm font-black text-white">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              placeholder="you@business.com"
              className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0D0F13] px-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-[#D6B46A]"
            />
          </label>
          <label>
            <span className="text-sm font-black text-white">Phone</span>
            <div className="mt-2 grid grid-cols-[110px_1fr] gap-2">
              <select
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                className="h-12 rounded-xl border border-white/10 bg-[#0D0F13] px-3 text-sm font-semibold text-white outline-none focus:border-[#D6B46A]"
              >
                {countryCodes.map((item) => (
                  <option key={`${item.label}-${item.value}`} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                placeholder="Phone number"
                className="h-12 rounded-xl border border-white/10 bg-[#0D0F13] px-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-[#D6B46A]"
              />
            </div>
          </label>
          <label>
            <span className="text-sm font-black text-white">Business Name</span>
            <input
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              required
              placeholder="Business name"
              className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0D0F13] px-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-[#D6B46A]"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-sm font-black text-white">Website</span>
            <input
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              required
              placeholder="https://example.com"
              className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0D0F13] px-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-[#D6B46A]"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-xl bg-[#D6B46A] px-6 text-sm font-black uppercase tracking-[0.14em] text-[#090A0D] transition hover:bg-[#F4D98F] disabled:cursor-not-allowed disabled:bg-[#8e7a4a] sm:col-span-2"
          >
            {isSubmitting ? "Submitting" : "Request My Fix Plan"}
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
