export interface PlanConfig {
  name: string;
  label: string;
  price: number;
  maxAssets: number;
  allowedScanners: string[];
  maxScansPerDay: number;
  scanCooldownMs: number;
  historyDays: number;
  pdfReports: boolean;
  customLogo: boolean;
  apiAccess: boolean;
}

export const PLANS: Record<string, PlanConfig> = {
  starter: {
    name: "starter",
    label: "Starter",
    price: 49,
    maxAssets: 3,
    allowedScanners: ["port_scan", "ssl_check", "header_check"],
    maxScansPerDay: 1,
    scanCooldownMs: 7 * 24 * 60 * 60 * 1000, // 1 week
    historyDays: 30,
    pdfReports: false,
    customLogo: false,
    apiAccess: false,
  },
  professional: {
    name: "professional",
    label: "Professional",
    price: 149,
    maxAssets: 15,
    allowedScanners: [
      "port_scan", "ssl_check", "dns_check", "header_check",
      "tech_detect", "subdomain_scan", "cookie_check", "waf_detect",
      "email_security", "leaked_check",
    ],
    maxScansPerDay: 10,
    scanCooldownMs: 0,
    historyDays: 90,
    pdfReports: true,
    customLogo: false,
    apiAccess: false,
  },
  business: {
    name: "business",
    label: "Business",
    price: 299,
    maxAssets: Infinity,
    allowedScanners: [
      "port_scan", "ssl_check", "dns_check", "header_check",
      "tech_detect", "subdomain_scan", "cookie_check", "waf_detect",
      "email_security", "leaked_check",
    ],
    maxScansPerDay: Infinity,
    scanCooldownMs: 0,
    historyDays: 365,
    pdfReports: true,
    customLogo: true,
    apiAccess: true,
  },
};

export function getPlanConfig(plan: string): PlanConfig {
  return PLANS[plan] || PLANS.starter;
}

export function getSecurityGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: "A", color: "#00ff88" };
  if (score >= 80) return { grade: "B", color: "#22c55e" };
  if (score >= 70) return { grade: "C", color: "#eab308" };
  if (score >= 60) return { grade: "D", color: "#f97316" };
  return { grade: "F", color: "#ef4444" };
}

export function calculateSecurityScore(findings: { severity: string }[]): number {
  let score = 100;
  for (const f of findings) {
    switch (f.severity) {
      case "critical": score -= 30; break;
      case "high": score -= 15; break;
      case "medium": score -= 5; break;
      case "low": score -= 1; break;
    }
  }
  return Math.max(0, Math.min(100, score));
}
