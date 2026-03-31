import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  const configs = await prisma.alertConfig.findMany({
    where: { organizationId: orgId },
  });

  return NextResponse.json(configs);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, enabled } = await req.json();

  const updated = await prisma.alertConfig.update({
    where: { id },
    data: { enabled },
  });

  return NextResponse.json(updated);
}
