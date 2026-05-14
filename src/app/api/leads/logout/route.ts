import { NextResponse } from "next/server";
import { clearLeadsSessionCookie } from "@/lib/lead-system/leads-auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearLeadsSessionCookie(response);

  return response;
}
