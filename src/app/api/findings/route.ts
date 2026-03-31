import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = session.organizationId;
  const { searchParams } = new URL(req.url);
  const severity = searchParams.get("severity");
  const status = searchParams.get("status");

  const where: any = { organizationId: orgId };
  if (severity) where.severity = severity;
  if (status) where.status = status;

  const findings = await prisma.finding.findMany({
    where,
    include: { asset: true },
    orderBy: { detectedAt: "desc" },
  });

  return NextResponse.json(findings);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = session.organizationId;
  const { id, status } = await req.json();

  const finding = await prisma.finding.findFirst({ where: { id, organizationId: orgId } });
  if (!finding) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updated = await prisma.finding.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === "resolved" ? new Date() : null,
    },
  });

  return NextResponse.json(updated);
}
