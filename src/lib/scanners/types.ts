export interface FindingData {
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  cvssScore: number;
  remediation: string | null;
  cveId: string | null;
}
