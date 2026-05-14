import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const leadsSessionCookieName = "clientflow_leads_session";

const sessionMaxAgeSeconds = 60 * 60 * 12;

function getLeadsPassword() {
  return process.env.LEADS_PASSWORD || "";
}

function safeEqual(left: string, right: string) {
  if (!left || !right) {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(value: string, password: string) {
  return createHmac("sha256", password).update(value).digest("base64url");
}

export function isLeadsPasswordConfigured() {
  return Boolean(getLeadsPassword());
}

export function leadsPasswordMatches(input: string) {
  return safeEqual(input, getLeadsPassword());
}

export function createLeadsSessionValue() {
  const password = getLeadsPassword();
  const timestamp = Date.now().toString();

  return `${timestamp}.${sign(timestamp, password)}`;
}

export function isLeadsSessionValueValid(value?: string) {
  const password = getLeadsPassword();
  if (!password || !value) {
    return false;
  }

  const [timestamp, signature] = value.split(".");
  const issuedAt = Number(timestamp);

  if (!timestamp || !signature || !Number.isFinite(issuedAt)) {
    return false;
  }

  const ageSeconds = (Date.now() - issuedAt) / 1000;
  if (ageSeconds < 0 || ageSeconds > sessionMaxAgeSeconds) {
    return false;
  }

  return safeEqual(signature, sign(timestamp, password));
}

export function isLeadsSessionValid(request: NextRequest) {
  return isLeadsSessionValueValid(request.cookies.get(leadsSessionCookieName)?.value);
}

export function setLeadsSessionCookie(response: NextResponse) {
  response.cookies.set(leadsSessionCookieName, createLeadsSessionValue(), {
    httpOnly: true,
    maxAge: sessionMaxAgeSeconds,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });
}

export function clearLeadsSessionCookie(response: NextResponse) {
  response.cookies.set(leadsSessionCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });
}
