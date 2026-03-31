import * as tls from "tls";
import type { FindingData } from "./types";

export async function scanSSL(domain: string): Promise<FindingData[]> {
  const findings: FindingData[] = [];

  try {
    const { cert, protocol } = await new Promise<{
      cert: tls.PeerCertificate;
      protocol: string;
    }>((resolve, reject) => {
      const socket = tls.connect(
        {
          host: domain,
          port: 443,
          servername: domain,
          rejectUnauthorized: false,
          timeout: 10000,
        },
        () => {
          const cert = socket.getPeerCertificate();
          const protocol = socket.getProtocol() || "unknown";
          socket.end();
          if (!cert || !cert.subject) {
            reject(new Error("No se pudo obtener el certificado"));
          } else {
            resolve({ cert, protocol });
          }
        }
      );
      socket.on("timeout", () => {
        socket.destroy();
        reject(new Error("Timeout conectando a " + domain));
      });
      socket.on("error", (err) => reject(err));
    });

    // Check expiry
    const validTo = new Date(cert.valid_to);
    const now = new Date();
    const daysUntilExpiry = Math.floor(
      (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 0) {
      findings.push({
        title: "Certificado SSL expirado",
        description: `El certificado SSL de ${domain} expiró el ${validTo.toISOString().split("T")[0]}. El sitio mostrará errores de seguridad a los visitantes.`,
        severity: "critical",
        cvssScore: 8.6,
        remediation:
          "Renovar el certificado SSL inmediatamente. Considerar Let's Encrypt con renovación automática (certbot).",
        cveId: null,
      });
    } else if (daysUntilExpiry <= 30) {
      findings.push({
        title: `Certificado SSL expira en ${daysUntilExpiry} días`,
        description: `El certificado SSL de ${domain} expira el ${validTo.toISOString().split("T")[0]}. Quedan ${daysUntilExpiry} días. Emisor: ${cert.issuer?.O || "desconocido"}.`,
        severity: "high",
        cvssScore: 7.0,
        remediation:
          "Renovar el certificado SSL antes de que expire. Configurar renovación automática con certbot o similar.",
        cveId: null,
      });
    } else if (daysUntilExpiry <= 60) {
      findings.push({
        title: `Certificado SSL expira en ${daysUntilExpiry} días`,
        description: `El certificado SSL de ${domain} expira el ${validTo.toISOString().split("T")[0]}. Quedan ${daysUntilExpiry} días. Emisor: ${cert.issuer?.O || "desconocido"}.`,
        severity: "medium",
        cvssScore: 5.0,
        remediation:
          "Planificar la renovación del certificado SSL. Considerar Let's Encrypt con renovación automática.",
        cveId: null,
      });
    } else {
      findings.push({
        title: "Certificado SSL válido",
        description: `El certificado SSL de ${domain} es válido hasta ${validTo.toISOString().split("T")[0]} (${daysUntilExpiry} días restantes). Emisor: ${cert.issuer?.O || "desconocido"}.`,
        severity: "info",
        cvssScore: 0,
        remediation: null,
        cveId: null,
      });
    }

    // Check TLS version
    const proto = protocol.toUpperCase();
    if (proto.includes("TLSV1.0") || proto === "TLSV1") {
      findings.push({
        title: "TLS versión obsoleta (TLS 1.0)",
        description: `El servidor ${domain} negoció TLS 1.0, una versión obsoleta con vulnerabilidades conocidas (POODLE, BEAST).`,
        severity: "high",
        cvssScore: 7.4,
        remediation:
          "Deshabilitar TLS 1.0 y 1.1 en el servidor. Usar TLS 1.2 o superior.",
        cveId: "CVE-2014-3566",
      });
    } else if (proto.includes("TLSV1.1")) {
      findings.push({
        title: "TLS versión obsoleta (TLS 1.1)",
        description: `El servidor ${domain} negoció TLS 1.1, una versión obsoleta que los navegadores modernos ya no soportan.`,
        severity: "high",
        cvssScore: 7.4,
        remediation:
          "Deshabilitar TLS 1.0 y 1.1 en el servidor. Usar TLS 1.2 o superior.",
        cveId: null,
      });
    }

    // Self-signed check
    if (cert.issuer && cert.subject) {
      const issuerCN = cert.issuer.CN || "";
      const subjectCN = cert.subject.CN || "";
      if (issuerCN === subjectCN && !cert.issuer.O) {
        findings.push({
          title: "Certificado autofirmado detectado",
          description: `El certificado SSL de ${domain} parece ser autofirmado. Los navegadores mostrarán advertencias de seguridad.`,
          severity: "medium",
          cvssScore: 5.8,
          remediation:
            "Obtener un certificado de una autoridad certificadora reconocida (Let's Encrypt es gratuito).",
          cveId: null,
        });
      }
    }
  } catch (err: any) {
    findings.push({
      title: "Error al verificar SSL",
      description: `No se pudo conectar a ${domain}:443 para verificar el certificado SSL. Error: ${err.message}`,
      severity: "medium",
      cvssScore: 5.0,
      remediation:
        "Verificar que el dominio tiene un servicio HTTPS activo en el puerto 443.",
      cveId: null,
    });
  }

  return findings;
}
