import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const orgId = session.organizationId;

  const finding = await prisma.finding.findFirst({
    where: { id, organizationId: orgId },
    include: { asset: true, scan: true },
  });

  if (!finding) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(finding);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const orgId = session.organizationId;
  const { status } = await req.json();

  const validStatuses = ["open", "resolved", "accepted", "in_progress", "false_positive"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
  }

  const finding = await prisma.finding.findFirst({ where: { id, organizationId: orgId } });
  if (!finding) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updated = await prisma.finding.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === "resolved" ? new Date() : null,
    },
    include: { asset: true },
  });

  return NextResponse.json(updated);
}
