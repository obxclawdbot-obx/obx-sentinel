import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

interface ComplianceCheck {
  id: string;
  label: string;
  description: string;
  passed: boolean;
  relatedFindings: number;
  autoEvaluated: boolean;
}

interface Framework {
  id: string;
  name: string;
  checks: ComplianceCheck[];
  score: number;
}

function countByKeywords(findings: any[], keywords: string[]): number {
  return findings.filter((f: any) =>
    keywords.some((kw) => f.title.toLowerCase().includes(kw) || f.description.toLowerCase().includes(kw))
  ).length;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = session.organizationId;

  const [findings, scans] = await Promise.all([
    prisma.finding.findMany({
      where: { organizationId: orgId, status: { in: ["open", "in_progress"] } },
      select: { id: true, title: true, description: true, severity: true },
    }),
    prisma.scan.count({
      where: { asset: { organizationId: orgId }, status: "completed" },
    }),
  ]);

  const sslCount = countByKeywords(findings, ["ssl", "tls", "certificado", "certificate"]);
  const cookieCount = countByKeywords(findings, ["cookie", "cookies"]);
  const headerCount = countByKeywords(findings, ["header", "headers", "x-frame", "csp", "hsts", "x-content-type"]);
  const portCount = countByKeywords(findings, ["port", "puerto", "open port"]);
  const dnsCount = countByKeywords(findings, ["dns", "dnssec", "spf", "dmarc", "dkim"]);
  const totalFindings = findings.length;

  const gdprChecks: ComplianceCheck[] = [
    { id: "gdpr-ssl", label: "Certificado SSL válido", description: "Verifica que no haya hallazgos relacionados con SSL/TLS", passed: sslCount === 0, relatedFindings: sslCount, autoEvaluated: true },
    { id: "gdpr-cookies", label: "Política de cookies implementada", description: "Verifica la implementación de política de cookies", passed: cookieCount === 0, relatedFindings: cookieCount, autoEvaluated: true },
    { id: "gdpr-headers", label: "Headers de seguridad configurados", description: "Verifica headers de seguridad HTTP", passed: headerCount === 0, relatedFindings: headerCount, autoEvaluated: true },
    { id: "gdpr-tls", label: "Cifrado de datos en tránsito (TLS 1.2+)", description: "Verifica cifrado TLS moderno", passed: sslCount === 0, relatedFindings: sslCount, autoEvaluated: true },
    { id: "gdpr-registro", label: "Registro de actividades de tratamiento", description: "Verificación manual requerida", passed: false, relatedFindings: 0, autoEvaluated: false },
  ];

  const ensChecks: ComplianceCheck[] = [
    { id: "ens-acceso", label: "Control de acceso a servicios", description: "Verifica puertos abiertos innecesarios", passed: portCount === 0, relatedFindings: portCount, autoEvaluated: true },
    { id: "ens-comunicaciones", label: "Protección de comunicaciones (SSL/TLS)", description: "Verifica seguridad en comunicaciones", passed: sslCount === 0, relatedFindings: sslCount, autoEvaluated: true },
    { id: "ens-vulnerabilidades", label: "Gestión de vulnerabilidades", description: "Verifica que los hallazgos estén bajo control", passed: totalFindings <= 5, relatedFindings: totalFindings, autoEvaluated: true },
    { id: "ens-monitorizacion", label: "Monitorización del sistema", description: "Verifica frecuencia de escaneos", passed: scans >= 2, relatedFindings: 0, autoEvaluated: true },
    { id: "ens-dns", label: "Protección DNS (DNSSEC, SPF, DMARC)", description: "Verifica configuración DNS segura", passed: dnsCount === 0, relatedFindings: dnsCount, autoEvaluated: true },
  ];

  const isoChecks: ComplianceCheck[] = [
    { id: "iso-a131", label: "A.13.1 Seguridad de comunicaciones", description: "Verifica SSL y headers de seguridad", passed: sslCount === 0 && headerCount === 0, relatedFindings: sslCount + headerCount, autoEvaluated: true },
    { id: "iso-a126", label: "A.12.6 Gestión de vulnerabilidades técnicas", description: "Verifica gestión activa de vulnerabilidades", passed: totalFindings <= 3, relatedFindings: totalFindings, autoEvaluated: true },
    { id: "iso-a141", label: "A.14.1 Requisitos de seguridad", description: "Verifica puntuación general de seguridad", passed: totalFindings <= 5, relatedFindings: totalFindings, autoEvaluated: true },
    { id: "iso-a181", label: "A.18.1 Cumplimiento legal", description: "Verifica cumplimiento GDPR", passed: gdprChecks.filter((c) => c.passed).length >= 3, relatedFindings: 0, autoEvaluated: true },
  ];

  const calcScore = (checks: ComplianceCheck[]) => {
    const passing = checks.filter((c) => c.passed).length;
    return Math.round((passing / checks.length) * 100);
  };

  const frameworks: Framework[] = [
    { id: "gdpr", name: "GDPR (Protección de datos)", checks: gdprChecks, score: calcScore(gdprChecks) },
    { id: "ens", name: "ENS (Esquema Nacional de Seguridad)", checks: ensChecks, score: calcScore(ensChecks) },
    { id: "iso27001", name: "ISO 27001", checks: isoChecks, score: calcScore(isoChecks) },
  ];

  return NextResponse.json({ frameworks });
}
