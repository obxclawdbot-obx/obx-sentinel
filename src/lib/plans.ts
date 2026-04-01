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
  basico: {
    name: "basico",
    label: "Básico",
    price: 99,
    maxAssets: 5,
    allowedScanners: ["port_scan", "ssl_check"],
    maxScansPerDay: 1, // 1 per week = treat as 1/day with weekly check
    scanCooldownMs: 7 * 24 * 60 * 60 * 1000, // 1 week
    historyDays: 30,
    pdfReports: false,
    customLogo: false,
    apiAccess: false,
  },
  profesional: {
    name: "profesional",
    label: "Profesional",
    price: 199,
    maxAssets: 25,
    allowedScanners: ["port_scan", "ssl_check", "dns_check", "header_check"],
    maxScansPerDay: 5,
    scanCooldownMs: 0,
    historyDays: 90,
    pdfReports: true,
    customLogo: false,
    apiAccess: false,
  },
  enterprise: {
    name: "enterprise",
    label: "Enterprise",
    price: 299,
    maxAssets: Infinity,
    allowedScanners: ["port_scan", "ssl_check", "dns_check", "header_check"],
    maxScansPerDay: Infinity,
    scanCooldownMs: 0,
    historyDays: 365,
    pdfReports: true,
    customLogo: true,
    apiAccess: true,
  },
};

export function getPlanConfig(plan: string): PlanConfig {
  return PLANS[plan] || PLANS.basico;
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
