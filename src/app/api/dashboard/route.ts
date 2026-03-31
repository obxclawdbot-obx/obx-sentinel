import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = session.organizationId;

  const [totalAssets, totalFindings, findingsBySeverity, findingsByStatus] = await Promise.all([
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
  ]);

  const openFindings = findingsByStatus.find((f) => f.status === "open")?._count || 0;
  const criticalFindings = findingsBySeverity.find((f) => f.severity === "critical")?._count || 0;
  const highFindings = findingsBySeverity.find((f) => f.severity === "high")?._count || 0;

  // Security score: 100 - penalties
  const score = Math.max(
    0,
    100 - criticalFindings * 20 - highFindings * 10 -
    (findingsBySeverity.find((f) => f.severity === "medium")?._count || 0) * 5
  );

  return NextResponse.json({
    totalAssets,
    totalFindings,
    openFindings,
    criticalFindings,
    highFindings,
    score,
    findingsBySeverity: findingsBySeverity.map((f) => ({ severity: f.severity, count: f._count })),
    findingsByStatus: findingsByStatus.map((f) => ({ status: f.status, count: f._count })),
  });
}
