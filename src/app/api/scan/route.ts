// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  scanSSL, scanDNS, scanPorts, scanHeaders,
  scanTech, scanSubdomains, scanCookies, scanWAF,
  scanEmailSecurity, scanLeaked,
} from "@/lib/scanners";
import type { FindingData } from "@/lib/scanners";
import { getPlanConfig } from "@/lib/plans";
import { checkAndSendAlerts } from "@/lib/alerts";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = session.organizationId;
  const url = new URL(req.url);
  const scanId = url.searchParams.get("id");

  if (scanId) {
    const scan = await prisma.scan.findFirst({
      where: { id: scanId },
      include: { asset: true, findings: true },
    });
    return NextResponse.json(scan);
  }

  const scans = await prisma.scan.findMany({
    where: { asset: { organizationId: orgId } },
    include: { asset: true, _count: { select: { findings: true } } },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(scans);
}

async function runScanners(
  asset: { id: string; type: string; value: string; organizationId: string },
  scanId: string,
  allowedScanners: string[]
) {
  const allFindings: FindingData[] = [];

  try {
    const scannerPromises: Promise<FindingData[]>[] = [];

    if (asset.type === "domain") {
      const domain = asset.value.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      
      // Only run allowed scanners
      if (allowedScanners.includes("ssl_check")) {
        scannerPromises.push(scanSSL(domain));
      }
      if (allowedScanners.includes("dns_check")) {
        scannerPromises.push(scanDNS(domain));
      }
      if (allowedScanners.includes("port_scan")) {
        scannerPromises.push(scanPorts(domain));
      }
      if (allowedScanners.includes("header_check")) {
        scannerPromises.push(scanHeaders(`https://${domain}`));
      }
      if (allowedScanners.includes("tech_detect")) {
        scannerPromises.push(scanTech(`https://${domain}`));
      }
      if (allowedScanners.includes("subdomain_scan")) {
        scannerPromises.push(scanSubdomains(domain));
      }
      if (allowedScanners.includes("cookie_check")) {
        scannerPromises.push(scanCookies(`https://${domain}`));
      }
      if (allowedScanners.includes("waf_detect")) {
        scannerPromises.push(scanWAF(`https://${domain}`));
      }
      if (allowedScanners.includes("email_security")) {
        scannerPromises.push(scanEmailSecurity(domain));
      }
      if (allowedScanners.includes("leaked_check")) {
        scannerPromises.push(scanLeaked(domain));
      }
    } else if (asset.type === "ip") {
      if (allowedScanners.includes("port_scan")) {
        scannerPromises.push(scanPorts(asset.value));
      }
    }

    const startTime = Date.now();
    const results = await Promise.allSettled(scannerPromises);
    const elapsed = Date.now() - startTime;
    
    let fulfilled = 0;
    let rejected = 0;
    for (const result of results) {
      if (result.status === "fulfilled") {
        allFindings.push(...result.value);
        fulfilled++;
      } else {
        rejected++;
        console.error(`Scanner failed in scan ${scanId}:`, result.reason);
      }
    }
    console.log(`Scan ${scanId}: ${fulfilled} scanners OK, ${rejected} failed, ${allFindings.length} findings in ${elapsed}ms`);

    // Save findings to DB
    if (allFindings.length > 0) {
      await Promise.all(
        allFindings.map((f) =>
          prisma.finding.create({
            data: {
              title: f.title,
              description: f.description,
              severity: f.severity,
              cvssScore: f.cvssScore,
              status: "open",
              remediation: f.remediation,
              cveId: f.cveId,
              assetId: asset.id,
              scanId: scanId,
              organizationId: asset.organizationId,
            },
          })
        )
      );
    }

    // Mark scan as completed
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: "completed", completedAt: new Date() },
    });

    // Check and send alerts
    await checkAndSendAlerts(scanId);
  } catch (err: any) {
    console.error(`Scan ${scanId} failed:`, err);
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: "failed", completedAt: new Date() },
    });
  }
}

function getScanType(assetType: string): string {
  switch (assetType) {
    case "domain":
      return "full_scan";
    case "ip":
      return "port_scan";
    case "email":
      return "email_breach";
    default:
      return "full_scan";
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = session.organizationId;
  const { assetId } = await req.json();

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, organizationId: orgId },
  });

  if (!asset) return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 });

  if (asset.type === "email") {
    return NextResponse.json(
      { message: "Escaneo de email no disponible aún. Próximamente: verificación de brechas." },
      { status: 200 }
    );
  }

  // Plan gating: check scan frequency
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const planConfig = getPlanConfig(org?.plan || "starter");

  // Check scan cooldown / frequency
  if (planConfig.scanCooldownMs > 0) {
    const cutoff = new Date(Date.now() - planConfig.scanCooldownMs);
    const recentScans = await prisma.scan.count({
      where: {
        asset: { organizationId: orgId },
        startedAt: { gte: cutoff },
      },
    });
    if (recentScans >= planConfig.maxScansPerDay) {
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de escaneos del plan ${planConfig.label}. Mejora tu plan para escanear con más frecuencia.`,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }
  } else if (planConfig.maxScansPerDay !== Infinity) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayScans = await prisma.scan.count({
      where: {
        asset: { organizationId: orgId },
        startedAt: { gte: todayStart },
      },
    });
    if (todayScans >= planConfig.maxScansPerDay) {
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${planConfig.maxScansPerDay} escaneos/día del plan ${planConfig.label}. Mejora tu plan para más escaneos.`,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }
  }

  // Create scan record
  const scan = await prisma.scan.create({
    data: {
      assetId: asset.id,
      type: getScanType(asset.type),
      status: "running",
    },
    include: { asset: true },
  });

  // Run scanners in background with plan-allowed scanners
  runScanners(
    {
      id: asset.id,
      type: asset.type,
      value: asset.value,
      organizationId: orgId,
    },
    scan.id,
    planConfig.allowedScanners
  );

  // Return 202 immediately
  return NextResponse.json(
    {
      scan: {
        id: scan.id,
        status: "running",
        type: scan.type,
        asset: scan.asset,
      },
      message: "Escaneo iniciado. Los resultados estarán disponibles en unos segundos.",
    },
    { status: 202 }
  );
}
