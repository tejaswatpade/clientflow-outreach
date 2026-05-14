import { PricingClient } from "@/components/audit/PricingClient";

type PricingPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default function PricingPage({ searchParams }: PricingPageProps) {
  const score = Number(one(searchParams?.score));

  return (
    <PricingClient
      auditSubmissionId={one(searchParams?.auditSubmissionId)}
      initialEmail={one(searchParams?.email)}
      initialBusinessName={one(searchParams?.businessName)}
      initialWebsite={one(searchParams?.website)}
      mainIssue={one(searchParams?.mainIssue)}
      revenueLeakScore={Number.isFinite(score) ? score : undefined}
    />
  );
}
