import { NextRequest, NextResponse } from "next/server";
import { isLeadsPasswordConfigured, leadsPasswordMatches, setLeadsSessionCookie } from "@/lib/lead-system/leads-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isLeadsPasswordConfigured()) {
    return NextResponse.json({ error: "Lead password is not configured." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password || "";

  if (!leadsPasswordMatches(password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setLeadsSessionCookie(response);

  return response;
}
