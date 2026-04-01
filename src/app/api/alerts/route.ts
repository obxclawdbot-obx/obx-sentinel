import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = session.organizationId;
  const configs = await prisma.alertConfig.findMany({
    where: { organizationId: orgId },
  });

  return NextResponse.json(configs);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, enabled } = await req.json();

  const updated = await prisma.alertConfig.update({
    where: { id },
    data: { enabled },
  });

  return NextResponse.json(updated);
}
