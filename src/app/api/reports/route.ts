// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getPlanConfig, calculateSecurityScore, getSecurityGrade } from "@/lib/plans";
import { jsPDF } from "jspdf";

const ACCENT = "#00ff88";
const DARK = "#1a1a1a";
const SEVERITY_COLORS: Record<string, [number, number, number]> = {
  critical: [239, 68, 68],
  high: [249, 115, 22],
  medium: [234, 179, 8],
  low: [34, 197, 94],
  info: [59, 130, 246],
};

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const orgId = session.organizationId;

  // Plan check
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const plan = getPlanConfig(org?.plan || "starter");
  if (!plan.pdfReports) {
    return NextResponse.json(
      { error: "Los informes PDF no están disponibles en tu plan actual. Mejora a Professional o Business.", upgradeRequired: true },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const assetId = url.searchParams.get("assetId");
  const scanId = url.searchParams.get("scanId");

  if (!assetId && !scanId) {
    return NextResponse.json({ error: "Se requiere assetId o scanId" }, { status: 400 });
  }

  let asset: any;
  let scan: any;
  let findings: any[];

  if (scanId) {
    scan = await prisma.scan.findFirst({
      where: { id: scanId, asset: { organizationId: orgId } },
      include: { asset: true },
    });
    if (!scan) return NextResponse.json({ error: "Escaneo no encontrado" }, { status: 404 });
    asset = scan.asset;
    findings = await prisma.finding.findMany({
      where: { scanId: scan.id },
      orderBy: [{ severity: "asc" }, { cvssScore: "desc" }],
    });
  } else {
    asset = await prisma.asset.findFirst({
      where: { id: assetId!, organizationId: orgId },
    });
    if (!asset) return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 });
    scan = await prisma.scan.findFirst({
      where: { assetId: asset.id, status: "completed" },
      orderBy: { completedAt: "desc" },
    });
    findings = await prisma.finding.findMany({
      where: { assetId: asset.id },
      orderBy: [{ severity: "asc" }, { cvssScore: "desc" }],
    });
  }

  // Sort findings: critical first
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  findings.sort((a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5));

  // Calculate stats
  const score = calculateSecurityScore(findings);
  const { grade, color: gradeColor } = getSecurityGrade(score);
  const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;

  // Generate PDF
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function addFooter() {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Generado por OBX Sentinel — obxaistudio.com", margin, pageHeight - 10);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }
  }

  function checkPageBreak(needed: number) {
    if (y + needed > pageHeight - 25) {
      doc.addPage();
      y = margin;
    }
  }

  // === HEADER ===
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setFontSize(20);
  doc.setTextColor(...hexToRgb(ACCENT));
  doc.text("OBX Sentinel", margin, 18);
  doc.setFontSize(12);
  doc.setTextColor(200, 200, 200);
  doc.text("Informe de Seguridad", margin, 26);
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }), pageWidth - margin, 18, { align: "right" });
  doc.text(`Activo: ${asset.value}`, pageWidth - margin, 26, { align: "right" });

  y = 50;

  // === EXECUTIVE SUMMARY ===
  doc.setFontSize(14);
  doc.setTextColor(...hexToRgb(ACCENT));
  doc.text("Resumen Ejecutivo", margin, y);
  y += 2;
  doc.setDrawColor(...hexToRgb(ACCENT));
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 50, y);
  y += 8;

  // Grade box
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin, y, 30, 30, 3, 3, "F");
  doc.setFontSize(28);
  doc.setTextColor(...hexToRgb(gradeColor));
  doc.text(grade, margin + 15, y + 19, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`${score}/100`, margin + 15, y + 26, { align: "center" });

  // Summary details
  const summaryX = margin + 40;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Activo analizado: ${asset.value} (${asset.type})`, summaryX, y + 6);
  if (scan) {
    doc.text(`Fecha del escaneo: ${new Date(scan.completedAt || scan.startedAt).toLocaleDateString("es-ES")}`, summaryX, y + 13);
  }
  doc.text(`Total de hallazgos: ${findings.length}`, summaryX, y + 20);

  // Severity counts inline
  let sx = summaryX;
  const sevY = y + 28;
  for (const sev of ["critical", "high", "medium", "low", "info"]) {
    const col = SEVERITY_COLORS[sev];
    doc.setFillColor(...col);
    doc.roundedRect(sx, sevY - 4, 24, 7, 1, 1, "F");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(`${sev.toUpperCase()}: ${counts[sev]}`, sx + 12, sevY + 0.5, { align: "center" });
    sx += 27;
  }

  y += 42;

  // === FINDINGS TABLE ===
  checkPageBreak(20);
  doc.setFontSize(14);
  doc.setTextColor(...hexToRgb(ACCENT));
  doc.text("Tabla de Hallazgos", margin, y);
  y += 2;
  doc.setDrawColor(...hexToRgb(ACCENT));
  doc.line(margin, y, margin + 50, y);
  y += 6;

  if (findings.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("No se encontraron hallazgos.", margin, y);
    y += 10;
  } else {
    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("SEVERIDAD", margin + 2, y + 5);
    doc.text("TÍTULO", margin + 30, y + 5);
    doc.text("CVSS", pageWidth - margin - 25, y + 5);
    doc.text("ESTADO", pageWidth - margin - 12, y + 5);
    y += 9;

    for (const f of findings) {
      checkPageBreak(10);

      // Alternating row bg
      if (findings.indexOf(f) % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, y - 3.5, contentWidth, 7, "F");
      }

      // Severity badge
      const col = SEVERITY_COLORS[f.severity] || [150, 150, 150];
      doc.setFillColor(...col);
      doc.roundedRect(margin + 1, y - 3, 22, 5.5, 1, 1, "F");
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text(f.severity.toUpperCase(), margin + 12, y + 0.5, { align: "center" });

      // Title (truncated)
      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40);
      const titleMaxW = pageWidth - margin - 30 - (margin + 30);
      const titleLines = doc.splitTextToSize(f.title, titleMaxW);
      doc.text(titleLines[0], margin + 30, y + 0.5);

      // CVSS
      doc.setTextColor(80, 80, 80);
      doc.text(String(f.cvssScore?.toFixed(1) || "—"), pageWidth - margin - 25, y + 0.5);

      // Status
      doc.setFontSize(7);
      const statusLabel = f.status === "open" ? "Abierto" : f.status === "resolved" ? "Resuelto" : f.status;
      doc.text(statusLabel, pageWidth - margin - 12, y + 0.5);

      y += 7;
    }
  }

  y += 8;

  // === DETAILED FINDINGS ===
  checkPageBreak(20);
  doc.setFontSize(14);
  doc.setTextColor(...hexToRgb(ACCENT));
  doc.text("Detalle de Hallazgos", margin, y);
  y += 2;
  doc.setDrawColor(...hexToRgb(ACCENT));
  doc.line(margin, y, margin + 50, y);
  y += 8;

  for (const f of findings) {
    checkPageBreak(35);

    // Severity indicator bar
    const col = SEVERITY_COLORS[f.severity] || [150, 150, 150];
    doc.setFillColor(...col);
    doc.rect(margin, y, 2, 20, "F");

    // Title
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(f.title, margin + 6, y + 4);

    // Severity + CVSS line
    doc.setFontSize(8);
    doc.setTextColor(...col);
    doc.text(`${f.severity.toUpperCase()} · CVSS ${f.cvssScore?.toFixed(1) || "—"}`, margin + 6, y + 9);
    if (f.cveId) {
      doc.setTextColor(100, 100, 100);
      doc.text(`CVE: ${f.cveId}`, margin + 80, y + 9);
    }

    y += 14;

    // Description
    if (f.description) {
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      const descLines = doc.splitTextToSize(f.description, contentWidth - 8);
      const linesToShow = descLines.slice(0, 6);
      for (const line of linesToShow) {
        checkPageBreak(6);
        doc.text(line, margin + 6, y);
        y += 4;
      }
      y += 2;
    }

    // Remediation
    if (f.remediation) {
      checkPageBreak(10);
      doc.setFontSize(8);
      doc.setTextColor(...hexToRgb(ACCENT));
      doc.text("Remediación:", margin + 6, y);
      y += 4;
      doc.setTextColor(60, 60, 60);
      const remLines = doc.splitTextToSize(f.remediation, contentWidth - 8);
      const remToShow = remLines.slice(0, 4);
      for (const line of remToShow) {
        checkPageBreak(6);
        doc.text(line, margin + 6, y);
        y += 4;
      }
    }

    y += 8;
  }

  addFooter();

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const filename = `obx-sentinel-${asset.value}-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
