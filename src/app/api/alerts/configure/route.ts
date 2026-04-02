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

  // Get alert history
  const history = await prisma.alertHistory.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Derive global email settings from the first config that has them
  const configWithEmail = configs.find((c: any) => c.emailAddress);
  const globalEmail = configWithEmail?.emailAddress || "";
  const globalMinSeverity = configs[0]?.minSeverity || "medium";
  const globalEnabled = configs.some((c: any) => c.enabled);

  return NextResponse.json({
    configs,
    history,
    emailAddress: globalEmail,
    minSeverity: globalMinSeverity,
    emailEnabled: globalEnabled,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = session.organizationId;
  const { emailEnabled, emailAddress, minSeverity } = await req.json();

  // Update all existing configs for this org
  await prisma.alertConfig.updateMany({
    where: { organizationId: orgId },
    data: {
      enabled: emailEnabled,
      emailAddress: emailAddress || null,
      minSeverity: minSeverity || "medium",
    },
  });

  // If no configs exist, create default ones
  const existing = await prisma.alertConfig.count({ where: { organizationId: orgId } });
  if (existing === 0) {
    const defaultTypes = ["new_critical", "cert_expiry", "new_breach", "weekly_digest"];
    for (const type of defaultTypes) {
      await prisma.alertConfig.create({
        data: {
          organizationId: orgId,
          type,
          channel: "email",
          enabled: emailEnabled,
          emailAddress: emailAddress || null,
          minSeverity: minSeverity || "medium",
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}
