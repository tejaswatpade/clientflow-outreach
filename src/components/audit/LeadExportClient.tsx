"use client";

import { type FormEvent, useState } from "react";

type ExportType = "all" | "audit-submissions" | "fix-plan-requests";

type LeadExportClientProps = {
  initialAuthorized: boolean;
};

const exportOptions: Array<{ label: string; value: ExportType }> = [
  { label: "All Leads", value: "all" },
  { label: "Audit Leads", value: "audit-submissions" },
  { label: "Fix Requests", value: "fix-plan-requests" }
];

function getFilename(response: Response, exportType: ExportType) {
  const disposition = response.headers.get("content-disposition") || "";
  const filename = disposition.match(/filename="([^"]+)"/)?.[1];

  return filename || `clientflow-${exportType}-leads.csv`;
}

export function LeadExportClient({ initialAuthorized }: LeadExportClientProps) {
  const [isAuthorized, setIsAuthorized] = useState(initialAuthorized);
  const [password, setPassword] = useState("");
  const [exportType, setExportType] = useState<ExportType>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!password.trim()) {
      setError("Enter the password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leads/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Could not unlock leads.");
      }

      setPassword("");
      setIsAuthorized(true);
      setMessage("Unlocked.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not unlock leads.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function logout() {
    await fetch("/api/leads/logout", { method: "POST" }).catch(() => null);
    setIsAuthorized(false);
    setMessage("");
    setError("");
  }

  async function downloadLeads() {
    setError("");
    setMessage("");
    setIsDownloading(true);

    try {
      const response = await fetch(`/api/leads/export?type=${exportType}`);

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        if (response.status === 401) {
          setIsAuthorized(false);
        }
        throw new Error(data?.error || "Could not download leads.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getFilename(response, exportType);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage("CSV downloaded.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not download leads.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090A0D] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-[760px] flex-col justify-center px-4 py-14 sm:px-6">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D6B46A]">Private</p>
        <h1 className="mt-5 text-4xl font-black leading-[1.03] tracking-normal text-white sm:text-5xl">Lead Downloads</h1>

        <div className="mt-9 space-y-5 rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/30 sm:p-6">
          {!isAuthorized ? (
            <form onSubmit={login} className="space-y-5">
              <label>
                <span className="text-sm font-black text-white">Password</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  placeholder="Enter password"
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0D0F13] px-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-[#D6B46A]"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-[#D6B46A] px-6 text-sm font-black uppercase tracking-[0.14em] text-[#090A0D] transition hover:bg-[#F4D98F] disabled:cursor-not-allowed disabled:bg-[#8e7a4a]"
              >
                {isSubmitting ? "Unlocking" : "Unlock Leads"}
              </button>
            </form>
          ) : (
            <>
              <fieldset>
                <legend className="text-sm font-black text-white">Lead Type</legend>
                <div className="mt-2 grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-[#0D0F13] p-1 sm:grid-cols-3">
                  {exportOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setExportType(option.value)}
                      className={`h-11 rounded-xl px-3 text-sm font-black transition ${
                        exportType === option.value
                          ? "bg-[#D6B46A] text-[#090A0D]"
                          : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button
                type="button"
                onClick={downloadLeads}
                disabled={isDownloading}
                className="h-12 w-full rounded-xl bg-[#D6B46A] px-6 text-sm font-black uppercase tracking-[0.14em] text-[#090A0D] transition hover:bg-[#F4D98F] disabled:cursor-not-allowed disabled:bg-[#8e7a4a]"
              >
                {isDownloading ? "Downloading" : "Download CSV"}
              </button>
              <button
                type="button"
                onClick={logout}
                className="h-11 w-full rounded-xl border border-white/12 px-5 text-sm font-black uppercase tracking-[0.14em] text-white/60 transition hover:text-white"
              >
                Lock
              </button>
            </>
          )}

          {error ? (
            <p className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100">
              {message}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
