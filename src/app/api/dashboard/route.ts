// @ts-nocheck
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = session.organizationId;

  const [totalAssets, totalFindings, findingsBySeverity, findingsByStatus, recentFindings] = await Promise.all([
    prisma.asset.count({ where: { organizationId: orgId } }),
    prisma.finding.count({ where: { organizationId: orgId } }),
    prisma.finding.groupBy({
      by: ["severity"],
      where: { organizationId: orgId },
      _count: true,
    }),
    prisma.finding.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: true,
    }),
    prisma.finding.findMany({
      where: { organizationId: orgId },
      include: { asset: true },
      orderBy: { detectedAt: "desc" },
      take: 5,
    }),
  ]);

  const openFindings = findingsByStatus.find((f: any) => f.status === "open")?._count || 0;
  const criticalFindings = findingsBySeverity.find((f: any) => f.severity === "critical")?._count || 0;
  const highFindings = findingsBySeverity.find((f: any) => f.severity === "high")?._count || 0;

  const score = Math.max(
    0,
    100 - criticalFindings * 20 - highFindings * 10 -
    (findingsBySeverity.find((f: any) => f.severity === "medium")?._count || 0) * 5
  );

  // Mock SSL expirations
  const sslExpirations = [
    { domain: "ofimatic.com", expiresAt: new Date(Date.now() + 12 * 86400000).toISOString(), daysLeft: 12 },
    { domain: "laboralcheck.es", expiresAt: new Date(Date.now() + 28 * 86400000).toISOString(), daysLeft: 28 },
    { domain: "obxai.studio", expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(), daysLeft: 90 },
  ];

  return NextResponse.json({
    totalAssets,
    totalFindings,
    openFindings,
    criticalFindings,
    highFindings,
    score,
    findingsBySeverity: findingsBySeverity.map((f: any) => ({ severity: f.severity, count: f._count })),
    findingsByStatus: findingsByStatus.map((f: any) => ({ status: f.status, count: f._count })),
    recentFindings: recentFindings.map((f: any) => ({
      id: f.id,
      title: f.title,
      severity: f.severity,
      cvssScore: f.cvssScore,
      asset: f.asset?.value || "—",
      detectedAt: f.detectedAt,
    })),
    sslExpirations,
  });
}
