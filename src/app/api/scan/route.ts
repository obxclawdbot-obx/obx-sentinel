import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

// Stub scan engine - generates simulated findings
const SIMULATED_FINDINGS = [
  {
    title: "Puerto SSH (22) expuesto a Internet",
    description: "El servicio SSH está accesible desde Internet sin restricción de IP. Esto permite ataques de fuerza bruta.",
    severity: "high",
    cvssScore: 7.5,
    remediation: "Restringir acceso SSH por IP mediante firewall. Usar autenticación por clave pública. Considerar cambiar el puerto.",
    cveId: null,
  },
  {
    title: "Certificado SSL próximo a expirar",
    description: "El certificado SSL expira en menos de 30 días. Si no se renueva, los usuarios verán advertencias de seguridad.",
    severity: "medium",
    cvssScore: 5.0,
    remediation: "Renovar el certificado SSL. Considerar usar Let's Encrypt con renovación automática.",
    cveId: null,
  },
  {
    title: "Registro SPF no configurado",
    description: "El dominio no tiene registro SPF en DNS, permitiendo suplantación de emails (spoofing).",
    severity: "medium",
    cvssScore: 5.3,
    remediation: "Añadir registro TXT SPF en DNS: v=spf1 include:_spf.google.com ~all (ajustar según proveedor de correo).",
    cveId: null,
  },
];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = session.organizationId;
  const { assetId } = await req.json();

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, organizationId: orgId },
  });

  if (!asset) return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 });

  // Create scan
  const scan = await prisma.scan.create({
    data: {
      assetId: asset.id,
      type: asset.type === "domain" ? "dns_check" : asset.type === "ip" ? "port_scan" : "email_breach",
      status: "completed",
      completedAt: new Date(),
    },
  });

  // Generate 1-2 random findings
  const numFindings = Math.floor(Math.random() * 2) + 1;
  const selectedFindings = SIMULATED_FINDINGS.sort(() => Math.random() - 0.5).slice(0, numFindings);

  const findings = await Promise.all(
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

  return NextResponse.json({ scan, findings });
}
