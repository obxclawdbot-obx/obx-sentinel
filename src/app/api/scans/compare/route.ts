import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const scan1Id = searchParams.get("scan1");
  const scan2Id = searchParams.get("scan2");

  if (!scan1Id || !scan2Id) {
    return NextResponse.json({ error: "Se requieren scan1 y scan2" }, { status: 400 });
  }

  const orgId = session.organizationId;

  const [scan1, scan2] = await Promise.all([
    prisma.scan.findFirst({
      where: { id: scan1Id, asset: { organizationId: orgId } },
      include: { findings: { select: { id: true, title: true, severity: true, cvssScore: true, assetId: true, description: true } } },
    }),
    prisma.scan.findFirst({
      where: { id: scan2Id, asset: { organizationId: orgId } },
      include: { findings: { select: { id: true, title: true, severity: true, cvssScore: true, assetId: true, description: true } } },
    }),
  ]);

  if (!scan1 || !scan2) {
    return NextResponse.json({ error: "Escaneo no encontrado" }, { status: 404 });
  }

  const makeKey = (f: any) => `${f.title}::${f.assetId}`;
  const scan1Keys = new Set(scan1.findings.map(makeKey));
  const scan2Keys = new Set(scan2.findings.map(makeKey));

  const newFindings = scan2.findings.filter((f: any) => !scan1Keys.has(makeKey(f)));
  const resolved = scan1.findings.filter((f: any) => !scan2Keys.has(makeKey(f)));
  const persistent = scan2.findings.filter((f: any) => scan1Keys.has(makeKey(f)));

  const calcScore = (findings: any[]) => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of findings) {
      if (f.severity in counts) counts[f.severity as keyof typeof counts]++;
    }
    return Math.max(0, 100 - (counts.critical * 20 + counts.high * 10 + counts.medium * 5 + counts.low * 2));
  };

  const score1 = calcScore(scan1.findings);
  const score2 = calcScore(scan2.findings);

  return NextResponse.json({
    new: newFindings,
    resolved,
    persistent,
    score1,
    score2,
    scoreDelta: score2 - score1,
  });
}
