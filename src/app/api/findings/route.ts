import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = (session.user as any).organizationId;
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
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = (session.user as any).organizationId;
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
