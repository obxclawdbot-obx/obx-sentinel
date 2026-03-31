// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

const SIMULATED_FINDINGS = [
  {
    title: "Puerto SSH (22) expuesto a Internet",
    description: "El servicio SSH está accesible desde Internet sin restricción de IP. Esto permite ataques de fuerza bruta.",
    severity: "high",
    cvssScore: 7.5,
    remediation: "Restringir acceso SSH por IP mediante firewall. Usar autenticación por clave pública.",
    cveId: null,
  },
  {
    title: "Certificado SSL próximo a expirar",
    description: "El certificado SSL expira en menos de 30 días.",
    severity: "medium",
    cvssScore: 5.0,
    remediation: "Renovar el certificado SSL. Considerar usar Let's Encrypt con renovación automática.",
    cveId: null,
  },
  {
    title: "Registro SPF no configurado",
    description: "El dominio no tiene registro SPF en DNS, permitiendo suplantación de emails.",
    severity: "medium",
    cvssScore: 5.3,
    remediation: "Añadir registro TXT SPF en DNS.",
    cveId: null,
  },
  {
    title: "Cabecera X-Frame-Options ausente",
    description: "La cabecera X-Frame-Options no está configurada, permitiendo ataques de clickjacking.",
    severity: "low",
    cvssScore: 4.3,
    remediation: "Añadir cabecera X-Frame-Options: DENY o SAMEORIGIN.",
    cveId: null,
  },
  {
    title: "Versión de servidor expuesta",
    description: "El servidor web revela su versión en las cabeceras HTTP.",
    severity: "info",
    cvssScore: 2.0,
    remediation: "Configurar el servidor para no revelar la versión.",
    cveId: null,
  },
  {
    title: "CVE-2024-21762 - FortiOS Out-of-bound Write",
    description: "Vulnerabilidad crítica de escritura fuera de límites en FortiOS SSL VPN.",
    severity: "critical",
    cvssScore: 9.8,
    remediation: "Actualizar FortiOS a la última versión parcheada.",
    cveId: "CVE-2024-21762",
  },
];

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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = session.organizationId;
  const { assetId } = await req.json();

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, organizationId: orgId },
  });

  if (!asset) return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 });

  // Create scan in "running" status
  const scan = await prisma.scan.create({
    data: {
      assetId: asset.id,
      type: asset.type === "domain" ? "dns_check" : asset.type === "ip" ? "port_scan" : "email_breach",
      status: "running",
    },
    include: { asset: true },
  });

  // Background: wait 2s, generate findings, mark complete
  (async () => {
    await new Promise((r) => setTimeout(r, 2000));

    const numFindings = Math.floor(Math.random() * 3) + 1;
    const selectedFindings = [...SIMULATED_FINDINGS].sort(() => Math.random() - 0.5).slice(0, numFindings);

    await Promise.all(
      selectedFindings.map((f) =>
        prisma.finding.create({
          data: {
            ...f,
            assetId: asset.id,
            scanId: scan.id,
            organizationId: orgId,
          },
        })
      )
    );

    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: "completed", completedAt: new Date() },
    });
  })();

  return NextResponse.json({ scan });
}
