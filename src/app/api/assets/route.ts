import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = session.organizationId;
  const assets = await prisma.asset.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = session.organizationId;
  const { type, value } = await req.json();

  if (!type || !value) {
    return NextResponse.json({ error: "Tipo y valor son obligatorios" }, { status: 400 });
  }

  const asset = await prisma.asset.create({
    data: { type, value, status: "active", organizationId: orgId },
  });

  return NextResponse.json(asset);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obligatorio" }, { status: 400 });

  // Verify ownership
  const asset = await prisma.asset.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!asset) return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 });

  // Delete related scans and findings first
  await prisma.finding.deleteMany({ where: { scan: { assetId: id } } });
  await prisma.scan.deleteMany({ where: { assetId: id } });
  await prisma.asset.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
