import type { ScrapedWebsite } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (compatible; BookingRevenueLeadBot/1.0; +https://example.com/lead-analysis)";

function ensureUrl(value: string) {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withProtocol);
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)));
}

function cleanText(value: string) {
  return decodeEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: string[], limit: number) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean))).slice(0, limit);
}

function getMeta(html: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["'][^>]*>`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return cleanText(match[1]);
    }
  }

  return "";
}

function extractTagText(html: string, tagName: string, limit: number) {
  const matches = html.matchAll(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi"));
  return unique(
    Array.from(matches)
      .map((match) => cleanText(match[1] ?? ""))
      .filter((item) => item.length > 1),
    limit
  );
}

function extractLinks(html: string, baseUrl: URL) {
  const matches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  const links = Array.from(matches).map((match) => {
    const href = match[1] ?? "";
    const text = cleanText(match[2] ?? "");
    try {
      return {
        href: new URL(href, baseUrl).toString(),
        text
      };
    } catch {
      return { href, text };
    }
  });

  return links;
}

function stripNoise(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ");
}

export async function scrapeWebsite(rawUrl: string): Promise<ScrapedWebsite> {
  const url = ensureUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 16000);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      redirect: "follow",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Website returned ${response.status}`);
    }

    const html = await response.text();
    const finalUrl = new URL(response.url || url.toString());
    const cleanHtml = stripNoise(html);
    const title = cleanText(cleanHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const description = getMeta(cleanHtml, "description") || getMeta(cleanHtml, "og:description");
    const h1 = extractTagText(cleanHtml, "h1", 8);
    const h2 = extractTagText(cleanHtml, "h2", 18);
    const buttonTexts = extractTagText(cleanHtml, "button", 20);
    const links = extractLinks(cleanHtml, finalUrl);
    const ctas = unique(
      [
        ...buttonTexts,
        ...links
          .filter((link) => /book|call|contact|schedule|consult|quote|reserve|get started|appointment/i.test(link.text))
          .map((link) => link.text)
      ],
      18
    );
    const socialLinks = unique(
      links
        .filter((link) => /instagram|facebook|linkedin|tiktok|youtube|twitter|x\.com/i.test(link.href))
        .map((link) => link.href),
      10
    );
    const bodyText = cleanText(cleanHtml).slice(0, 16000);
    const linkText = links.map((link) => `${link.href} ${link.text}`).join(" ");
    const emails = unique(
      [...(bodyText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []), ...(linkText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [])],
      12
    );
    const phones = unique(bodyText.match(/(?:\+?\d[\s().-]*){9,}\d/g) ?? [], 8);

    return {
      url: url.toString(),
      finalUrl: finalUrl.toString(),
      host: finalUrl.host.replace(/^www\./, ""),
      title,
      description,
      headings: unique([...h1, ...h2], 24),
      ctas,
      emails,
      phones,
      socialLinks,
      formCount: (cleanHtml.match(/<form[\s>]/gi) ?? []).length,
      text: bodyText
    };
  } finally {
    clearTimeout(timeout);
  }
}
