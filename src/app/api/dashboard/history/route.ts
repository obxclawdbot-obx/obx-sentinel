import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = session.organizationId;

  const scans = await prisma.scan.findMany({
    where: {
      asset: { organizationId: orgId },
      status: "completed",
    },
    include: {
      findings: {
        select: { severity: true },
      },
    },
    orderBy: { startedAt: "asc" },
  });

  const history = scans.map((scan: any) => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of scan.findings) {
      if (f.severity in counts) {
        counts[f.severity as keyof typeof counts]++;
      }
    }
    const rawScore = 100 - (counts.critical * 20 + counts.high * 10 + counts.medium * 5 + counts.low * 2 + counts.info * 0);
    const score = Math.max(0, rawScore);

    return {
      date: scan.completedAt || scan.startedAt,
      score,
      findings_count: scan.findings.length,
      ...counts,
    };
  });

  return NextResponse.json(history);
}
