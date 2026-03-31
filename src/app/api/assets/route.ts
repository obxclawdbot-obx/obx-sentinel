import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  const assets = await prisma.asset.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  const { type, value } = await req.json();

  if (!type || !value) {
    return NextResponse.json({ error: "Tipo y valor son obligatorios" }, { status: 400 });
  }

  const asset = await prisma.asset.create({
    data: { type, value, status: "active", organizationId: orgId },
  });

  return NextResponse.json(asset);
}
