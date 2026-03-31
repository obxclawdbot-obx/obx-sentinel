import * as dns from "dns";
import { promisify } from "util";
import type { FindingData } from "./types";

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolveNs = promisify(dns.resolveNs);
const resolveCname = promisify(dns.resolveCname);

async function safeResolve<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function scanDNS(domain: string): Promise<FindingData[]> {
  const findings: FindingData[] = [];

  try {
    // Resolve all record types in parallel
    const [aRecords, aaaaRecords, mxRecords, txtRecords, nsRecords, cnameRecords] =
      await Promise.all([
        safeResolve(() => resolve4(domain)),
        safeResolve(() => resolve6(domain)),
        safeResolve(() => resolveMx(domain)),
        safeResolve(() => resolveTxt(domain)),
        safeResolve(() => resolveNs(domain)),
        safeResolve(() => resolveCname(domain)),
      ]);

    // Info: DNS records summary
    const recordSummary: string[] = [];
    if (aRecords?.length) recordSummary.push(`A: ${aRecords.join(", ")}`);
    if (aaaaRecords?.length) recordSummary.push(`AAAA: ${aaaaRecords.join(", ")}`);
    if (mxRecords?.length)
      recordSummary.push(`MX: ${mxRecords.map((r) => r.exchange).join(", ")}`);
    if (nsRecords?.length) recordSummary.push(`NS: ${nsRecords.join(", ")}`);

    if (recordSummary.length > 0) {
      findings.push({
        title: "Registros DNS encontrados",
        description: `Registros DNS de ${domain}: ${recordSummary.join(" | ")}`,
        severity: "info",
        cvssScore: 0,
        remediation: null,
        cveId: null,
      });
    }

    if (!aRecords && !aaaaRecords) {
      findings.push({
        title: "Dominio sin registros A/AAAA",
        description: `El dominio ${domain} no tiene registros A ni AAAA. Puede que el dominio no esté configurado o sea solo un dominio de correo.`,
        severity: "info",
        cvssScore: 0,
        remediation: "Verificar si el dominio debería tener registros A/AAAA.",
        cveId: null,
      });
    }

    // Check SPF
    const allTxt = txtRecords ? txtRecords.flat() : [];
    const hasSPF = allTxt.some((t) => t.startsWith("v=spf1"));

    if (!hasSPF) {
      findings.push({
        title: "Registro SPF no configurado",
        description: `El dominio ${domain} no tiene registro SPF (Sender Policy Framework) en DNS. Sin SPF, cualquier servidor puede enviar emails en nombre de este dominio, facilitando ataques de phishing y suplantación de identidad.`,
        severity: "medium",
        cvssScore: 5.3,
        remediation:
          'Añadir un registro TXT SPF en DNS. Ejemplo: "v=spf1 include:_spf.google.com ~all" (ajustar según el proveedor de correo).',
        cveId: null,
      });
    } else {
      // Check SPF quality
      const spfRecord = allTxt.find((t) => t.startsWith("v=spf1")) || "";
      if (spfRecord.includes("+all")) {
        findings.push({
          title: "SPF demasiado permisivo",
          description: `El registro SPF de ${domain} usa "+all", lo que permite a cualquier servidor enviar correo en nombre del dominio. Esto anula completamente la protección SPF.`,
          severity: "high",
          cvssScore: 7.1,
          remediation:
            'Cambiar "+all" por "~all" (softfail) o "-all" (hardfail) en el registro SPF.',
          cveId: null,
        });
      }
    }

    // Check DMARC
    const dmarcTxt = await safeResolve(() => resolveTxt(`_dmarc.${domain}`));
    const dmarcRecords = dmarcTxt ? dmarcTxt.flat() : [];
    const hasDMARC = dmarcRecords.some((t) => t.startsWith("v=DMARC1"));

    if (!hasDMARC) {
      findings.push({
        title: "Registro DMARC no configurado",
        description: `El dominio ${domain} no tiene registro DMARC. Sin DMARC, no hay política para manejar correos que fallan SPF/DKIM, reduciendo la protección contra suplantación de identidad.`,
        severity: "medium",
        cvssScore: 5.3,
        remediation:
          'Añadir un registro TXT DMARC en _dmarc.${domain}. Ejemplo: "v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}".',
        cveId: null,
      });
    } else {
      const dmarcRecord = dmarcRecords.find((t) => t.startsWith("v=DMARC1")) || "";
      if (dmarcRecord.includes("p=none")) {
        findings.push({
          title: "Política DMARC en modo monitor (p=none)",
          description: `El dominio ${domain} tiene DMARC configurado pero con política "none", lo que significa que los correos fraudulentos no se bloquean ni se envían a cuarentena.`,
          severity: "low",
          cvssScore: 3.5,
          remediation:
            'Cambiar la política DMARC a "p=quarantine" o "p=reject" una vez verificado que los correos legítimos pasan SPF/DKIM.',
          cveId: null,
        });
      }
    }

    // Check DKIM (common selectors)
    const dkimSelectors = ["default", "google", "selector1", "selector2", "k1", "mail"];
    let dkimFound = false;
    for (const sel of dkimSelectors) {
      const dkimTxt = await safeResolve(() =>
        resolveTxt(`${sel}._domainkey.${domain}`)
      );
      if (dkimTxt && dkimTxt.flat().some((t) => t.includes("v=DKIM1"))) {
        dkimFound = true;
        break;
      }
    }

    if (!dkimFound) {
      findings.push({
        title: "DKIM no detectado (selectores comunes)",
        description: `No se encontró registro DKIM en los selectores comunes para ${domain}. Nota: el selector DKIM puede ser personalizado y no ser detectable con este escaneo.`,
        severity: "low",
        cvssScore: 3.0,
        remediation:
          "Configurar DKIM en el servidor de correo y publicar la clave pública en DNS.",
        cveId: null,
      });
    }

    // Dangling CNAME check
    if (cnameRecords?.length) {
      for (const cname of cnameRecords) {
        const target = await safeResolve(() => resolve4(cname));
        if (!target) {
          findings.push({
            title: "CNAME colgante detectado (subdomain takeover risk)",
            description: `El dominio ${domain} tiene un CNAME apuntando a ${cname}, que no resuelve a ninguna IP. Esto podría permitir un ataque de subdomain takeover.`,
            severity: "high",
            cvssScore: 7.5,
            remediation:
              "Eliminar el registro CNAME o asegurarse de que el destino está correctamente configurado.",
            cveId: null,
          });
        }
      }
    }

    // Check for multiple NS (resilience)
    if (nsRecords && nsRecords.length < 2) {
      findings.push({
        title: "Solo un servidor NS configurado",
        description: `El dominio ${domain} solo tiene ${nsRecords.length} servidor(es) NS. Se recomienda al menos 2 para redundancia.`,
        severity: "low",
        cvssScore: 3.0,
        remediation:
          "Configurar al menos 2 servidores DNS autoritativos para el dominio.",
        cveId: null,
      });
    }
  } catch (err: any) {
    findings.push({
      title: "Error al verificar DNS",
      description: `No se pudieron resolver los registros DNS de ${domain}. Error: ${err.message}`,
      severity: "medium",
      cvssScore: 5.0,
      remediation: "Verificar que el dominio existe y tiene DNS configurado.",
      cveId: null,
    });
  }

  return findings;
}
