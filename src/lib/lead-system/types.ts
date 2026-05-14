export type ScrapedWebsite = {
  url: string;
  finalUrl: string;
  host: string;
  title: string;
  description: string;
  headings: string[];
  ctas: string[];
  emails: string[];
  phones: string[];
  socialLinks: string[];
  formCount: number;
  text: string;
};

export type BusinessType =
  | "Med spa"
  | "Clinic / healthcare"
  | "Dental"
  | "Salon / beauty"
  | "Fitness / gym"
  | "Home services"
  | "Legal"
  | "Real estate"
  | "Restaurant"
  | "Auto repair"
  | "B2B service"
  | "Ecommerce"
  | "Other local business";

export type Severity = "High" | "Medium" | "Low";

export type RevenueLeakItem = {
  issueName: string;
  severity: Severity;
  explanation: string;
};

export type BookingCostIssue = {
  issue: string;
  whyItMatters: string;
  suggestedFix: string;
};

export type AuditCategory = {
  category: string;
  finding: string;
  whyItMatters: string;
  suggestedFix: string;
  severity: Severity;
};

export type PageFix = {
  problem: string;
  suggestedFix: string;
};

export type MissedRevenueOpportunity = {
  title: string;
  currentState: string;
  improvedState: string;
  impact: string;
};

export type ImpactProjection = {
  currentFunnel: string;
  improvedScenario: string;
  projectedGain: string;
};

export type WebsiteRevenueAudit = {
  businessName: string;
  businessType: BusinessType | string;
  websiteUrl: string;
  revenueLeakScore: number;
  mainIssue: string;
  estimatedLoss: string;
  whatsWorking: string[];
  costingBookings: BookingCostIssue[];
  nonServiceAudit: AuditCategory[];
  revenueLeakBreakdown: RevenueLeakItem[];
  pageAnalysis: {
    homepage: PageFix;
    servicesPage: PageFix;
    contactPage: PageFix;
  };
  missedRevenueOpportunities: MissedRevenueOpportunity[];
  fixPlan: string[];
  impactProjection: ImpactProjection;
  finalInsight: string;
};

export type AnalyzeRevenueAuditInput = {
  websiteUrl: string;
  businessType: BusinessType | string;
  reportEmail: string;
};

export type ImplementationRequestInput = {
  auditSubmissionId?: string | null;
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  businessName: string;
  websiteUrl: string;
  mainIssue?: string;
  revenueLeakScore?: number;
  sourcePlan?: string;
};

export type LeadIntentType = "pricing_clicked" | "pricing_viewed" | "fix_form_opened" | "fix_plan_requested";

export type LeadIntentInput = {
  auditSubmissionId?: string | null;
  email?: string;
  websiteUrl?: string;
  intent: LeadIntentType;
};
