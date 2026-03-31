// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { scanSSL, scanDNS, scanPorts, scanHeaders } from "@/lib/scanners";
import type { FindingData } from "@/lib/scanners";

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
  scanId: string
) {
  const allFindings: FindingData[] = [];

  try {
    const scannerPromises: Promise<FindingData[]>[] = [];

    if (asset.type === "domain") {
      const domain = asset.value.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      scannerPromises.push(scanSSL(domain));
      scannerPromises.push(scanDNS(domain));
      scannerPromises.push(scanPorts(domain));
      scannerPromises.push(scanHeaders(`https://${domain}`));
    } else if (asset.type === "ip") {
      scannerPromises.push(scanPorts(asset.value));
    }
    // email type: skip for now (future: breach check)

    const results = await Promise.all(scannerPromises);
    for (const findings of results) {
      allFindings.push(...findings);
    }

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
  } catch (err: any) {
    // Mark scan as failed
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

  // Create scan record
  const scan = await prisma.scan.create({
    data: {
      assetId: asset.id,
      type: getScanType(asset.type),
      status: "running",
    },
    include: { asset: true },
  });

  // Run scanners in background (non-blocking)
  runScanners(
    {
      id: asset.id,
      type: asset.type,
      value: asset.value,
      organizationId: orgId,
    },
    scan.id
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
