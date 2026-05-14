import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LeadExportClient } from "@/components/audit/LeadExportClient";
import { isLeadsSessionValueValid, leadsSessionCookieName } from "@/lib/lead-system/leads-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lead Downloads",
  robots: {
    follow: false,
    index: false
  }
};

export default function LeadsPage() {
  const sessionValue = cookies().get(leadsSessionCookieName)?.value;

  return <LeadExportClient initialAuthorized={isLeadsSessionValueValid(sessionValue)} />;
}
