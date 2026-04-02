import { prisma } from "@/lib/db";

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

function meetsSeverityThreshold(findingSeverity: string, minSeverity: string): boolean {
  return (SEVERITY_ORDER[findingSeverity] ?? 5) <= (SEVERITY_ORDER[minSeverity] ?? 5);
}

export async function checkAndSendAlerts(scanId: string) {
  try {
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: { asset: true },
    });
    if (!scan) return;

    const orgId = scan.asset.organizationId;

    // Get findings from this scan
    const findings = await prisma.finding.findMany({
      where: { scanId },
    });

    if (findings.length === 0) return;

    // Get alert configs for this org
    const alertConfigs = await prisma.alertConfig.findMany({
      where: { organizationId: orgId, enabled: true },
    });

    if (alertConfigs.length === 0) return;

    // Check each config for matching findings
    for (const config of alertConfigs) {
      const minSev = config.minSeverity || "medium";
      const matchingFindings = findings.filter((f) => meetsSeverityThreshold(f.severity, minSev));

      if (matchingFindings.length === 0) continue;

      // Determine highest severity
      const highestSeverity = matchingFindings.reduce((acc, f) => {
        return (SEVERITY_ORDER[f.severity] ?? 5) < (SEVERITY_ORDER[acc] ?? 5) ? f.severity : acc;
      }, "info");

      const severityCounts: Record<string, number> = {};
      for (const f of matchingFindings) {
        severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1;
      }

      const countsStr = Object.entries(severityCounts)
        .sort(([a], [b]) => (SEVERITY_ORDER[a] ?? 5) - (SEVERITY_ORDER[b] ?? 5))
        .map(([sev, count]) => `${count} ${sev}`)
        .join(", ");

      const message = `[OBX Sentinel] Escaneo completado para ${scan.asset.value}: ${matchingFindings.length} hallazgos encontrados (${countsStr}). Severidad máxima: ${highestSeverity.toUpperCase()}.`;

      // Log the alert (email sending requires Resend/SendGrid integration)
      console.log(`📧 ALERTA [${config.type}]: ${message}`);
      if (config.emailAddress) {
        console.log(`   Destinatario: ${config.emailAddress}`);
      }

      // Save alert history
      await prisma.alertHistory.create({
        data: {
          organizationId: orgId,
          scanId,
          type: "scan_alert",
          severity: highestSeverity,
          findingsCount: matchingFindings.length,
          message,
          sent: false, // Will be true when email integration is active
        },
      });
    }
  } catch (err) {
    console.error("Error checking alerts:", err);
  }
}
