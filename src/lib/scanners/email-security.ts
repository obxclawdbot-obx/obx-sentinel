import * as dns from "dns";
import { promisify } from "util";
import type { FindingData } from "./types";

const resolveTxt = promisify(dns.resolveTxt);
const resolveMx = promisify(dns.resolveMx);

async function safeResolveTxt(domain: string): Promise<string[]> {
  try {
    const records = await resolveTxt(domain);
    return records.map((r) => r.join(""));
  } catch {
    return [];
  }
}

async function safeResolveMx(domain: string): Promise<dns.MxRecord[]> {
  try {
    return await resolveMx(domain);
  } catch {
    return [];
  }
}

const KNOWN_EMAIL_PROVIDERS: Record<string, string> = {
  "google.com": "Google Workspace",
  "googlemail.com": "Google Workspace",
  "outlook.com": "Microsoft 365",
  "microsoft.com": "Microsoft 365",
  "protection.outlook.com": "Microsoft 365",
  "pphosted.com": "Proofpoint",
  "mimecast.com": "Mimecast",
  "messagelabs.com": "Symantec/Broadcom",
  "barracudanetworks.com": "Barracuda",
  "zoho.com": "Zoho Mail",
  "ovh.net": "OVH",
  "ionos.com": "IONOS",
};

export async function scanEmailSecurity(domain: string): Promise<FindingData[]> {
  const findings: FindingData[] = [];
  let score = 0;
  const maxScore = 100;

  try {
    domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    // 1. MX Records
    const mxRecords = await safeResolveMx(domain);

    if (mxRecords.length === 0) {
      findings.push({
        title: "No se encontraron registros MX",
        description: `El dominio ${domain} no tiene registros MX configurados. No puede recibir correo electrónico.`,
        severity: "info",
        cvssScore: 0,
        remediation: "Si el dominio debe recibir correo, configurar registros MX en DNS.",
        cveId: null,
      });
    } else {
      score += 10;
      const mxList = mxRecords.map((r) => `${r.exchange} (prioridad: ${r.priority})`).join(", ");

      // Identify provider
      let provider = "Desconocido";
      for (const mx of mxRecords) {
        for (const [pattern, name] of Object.entries(KNOWN_EMAIL_PROVIDERS)) {
          if (mx.exchange.toLowerCase().includes(pattern)) {
            provider = name;
            break;
          }
        }
        if (provider !== "Desconocido") break;
      }

      findings.push({
        title: "Registros MX configurados",
        description: `MX de ${domain}: ${mxList}. Proveedor detectado: ${provider}.`,
        severity: "info",
        cvssScore: 0,
        remediation: null,
        cveId: null,
      });
    }

    // 2. SPF
    const txtRecords = await safeResolveTxt(domain);
    const spfRecord = txtRecords.find((t) => t.startsWith("v=spf1"));

    if (!spfRecord) {
      findings.push({
        title: "SPF no configurado",
        description: `El dominio ${domain} no tiene registro SPF. Cualquier servidor puede enviar emails suplantando este dominio.`,
        severity: "high",
        cvssScore: 7.1,
        remediation: 'Añadir un registro TXT SPF. Ejemplo: "v=spf1 include:_spf.google.com ~all"',
        cveId: null,
      });
    } else {
      score += 15;

      if (spfRecord.includes("+all")) {
        findings.push({
          title: "SPF con política permisiva (+all)",
          description: `El SPF de ${domain} usa "+all", permitiendo que cualquier servidor envíe correo. Esto anula la protección SPF.`,
          severity: "high",
          cvssScore: 7.1,
          remediation: 'Cambiar "+all" por "~all" (softfail) o "-all" (hardfail).',
          cveId: null,
        });
      } else if (spfRecord.includes("-all")) {
        score += 5;
        findings.push({
          title: "SPF con política estricta (-all)",
          description: `El SPF de ${domain} usa "-all" (hardfail). Solo los servidores autorizados pueden enviar correo.`,
          severity: "info",
          cvssScore: 0,
          remediation: null,
          cveId: null,
        });
      } else if (spfRecord.includes("~all")) {
        score += 2;
        findings.push({
          title: "SPF con softfail (~all)",
          description: `El SPF de ${domain} usa "~all" (softfail). Es recomendable pero menos estricto que "-all".`,
          severity: "low",
          cvssScore: 2.0,
          remediation: 'Considerar cambiar "~all" por "-all" para mayor protección.',
          cveId: null,
        });
      }

      // Too many includes
      const includes = (spfRecord.match(/include:/g) || []).length;
      if (includes > 10) {
        findings.push({
          title: "SPF con demasiados includes",
          description: `El registro SPF de ${domain} tiene ${includes} directivas include. SPF tiene un límite de 10 lookups DNS.`,
          severity: "medium",
          cvssScore: 4.3,
          remediation: "Reducir el número de includes en el SPF o usar mecanismos ip4/ip6 directos.",
          cveId: null,
        });
      }
    }

    // 3. DMARC
    const dmarcRecords = await safeResolveTxt(`_dmarc.${domain}`);
    const dmarcRecord = dmarcRecords.find((t) => t.startsWith("v=DMARC1"));

    if (!dmarcRecord) {
      findings.push({
        title: "DMARC no configurado",
        description: `El dominio ${domain} no tiene registro DMARC. Sin DMARC, no hay instrucciones para los servidores receptores sobre cómo manejar correos que fallan SPF/DKIM.`,
        severity: "high",
        cvssScore: 7.1,
        remediation: `Añadir registro TXT en _dmarc.${domain}: "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${domain}"`,
        cveId: null,
      });
    } else {
      score += 15;

      const policyMatch = dmarcRecord.match(/p=(\w+)/);
      const policy = policyMatch ? policyMatch[1].toLowerCase() : "none";

      if (policy === "reject") {
        score += 10;
        findings.push({
          title: "DMARC con política reject",
          description: `El dominio ${domain} tiene DMARC con p=reject. Los correos que no pasan SPF/DKIM son rechazados. Máxima protección.`,
          severity: "info",
          cvssScore: 0,
          remediation: null,
          cveId: null,
        });
      } else if (policy === "quarantine") {
        score += 5;
        findings.push({
          title: "DMARC con política quarantine",
          description: `El dominio ${domain} tiene DMARC con p=quarantine. Los correos sospechosos se envían a spam.`,
          severity: "low",
          cvssScore: 2.0,
          remediation: 'Considerar pasar a p=reject para máxima protección.',
          cveId: null,
        });
      } else {
        findings.push({
          title: "DMARC con política none (solo monitorización)",
          description: `El dominio ${domain} tiene DMARC con p=none. Los correos fraudulentos no se bloquean.`,
          severity: "medium",
          cvssScore: 5.3,
          remediation: 'Cambiar política a p=quarantine o p=reject tras verificar que los correos legítimos pasan SPF/DKIM.',
          cveId: null,
        });
      }

      // Check reporting
      if (dmarcRecord.includes("rua=")) {
        score += 5;
      } else {
        findings.push({
          title: "DMARC sin dirección de reportes (rua)",
          description: `El registro DMARC de ${domain} no incluye una dirección para recibir reportes agregados (rua).`,
          severity: "low",
          cvssScore: 2.0,
          remediation: `Añadir rua=mailto:dmarc-reports@${domain} al registro DMARC para recibir reportes.`,
          cveId: null,
        });
      }
    }

    // 4. DKIM
    const dkimSelectors = ["default", "google", "selector1", "selector2", "k1", "mail", "dkim", "s1", "s2"];
    let dkimFound = false;
    let dkimSelector = "";

    for (const sel of dkimSelectors) {
      const dkimRecords = await safeResolveTxt(`${sel}._domainkey.${domain}`);
      if (dkimRecords.some((t) => t.includes("v=DKIM1") || t.includes("p="))) {
        dkimFound = true;
        dkimSelector = sel;
        break;
      }
    }

    if (dkimFound) {
      score += 15;
      findings.push({
        title: "DKIM configurado",
        description: `Se encontró registro DKIM para ${domain} (selector: ${dkimSelector}). Los correos pueden ser verificados criptográficamente.`,
        severity: "info",
        cvssScore: 0,
        remediation: null,
        cveId: null,
      });
    } else {
      findings.push({
        title: "DKIM no detectado",
        description: `No se encontró registro DKIM en los selectores comunes para ${domain}. Sin DKIM, no se puede verificar la autenticidad criptográfica de los correos.`,
        severity: "medium",
        cvssScore: 5.3,
        remediation: "Configurar DKIM en el servidor de correo y publicar la clave pública en DNS con el selector correspondiente.",
        cveId: null,
      });
    }

    // 5. BIMI
    const bimiRecords = await safeResolveTxt(`default._bimi.${domain}`);
    const bimiRecord = bimiRecords.find((t) => t.includes("v=BIMI1"));

    if (bimiRecord) {
      score += 5;
      findings.push({
        title: "BIMI configurado",
        description: `El dominio ${domain} tiene un registro BIMI que permite mostrar el logo de la marca en los clientes de correo compatibles.`,
        severity: "info",
        cvssScore: 0,
        remediation: null,
        cveId: null,
      });
    } else {
      findings.push({
        title: "BIMI no configurado",
        description: `El dominio ${domain} no tiene registro BIMI. BIMI permite mostrar el logo de la marca en bandejas de entrada compatibles.`,
        severity: "info",
        cvssScore: 0,
        remediation: `Considerar configurar BIMI en default._bimi.${domain} con el logo SVG de la marca. Requiere DMARC con p=quarantine o p=reject.`,
        cveId: null,
      });
    }

    // 6. MTA-STS
    const mtaStsRecords = await safeResolveTxt(`_mta-sts.${domain}`);
    const mtaSts = mtaStsRecords.find((t) => t.includes("v=STSv1"));

    if (mtaSts) {
      score += 10;
      findings.push({
        title: "MTA-STS configurado",
        description: `El dominio ${domain} tiene MTA-STS habilitado, lo que obliga a los servidores emisores a usar TLS para entregar correo.`,
        severity: "info",
        cvssScore: 0,
        remediation: null,
        cveId: null,
      });
    } else {
      findings.push({
        title: "MTA-STS no configurado",
        description: `El dominio ${domain} no tiene MTA-STS. Sin MTA-STS, las conexiones SMTP pueden ser degradadas a texto plano por un atacante.`,
        severity: "low",
        cvssScore: 3.5,
        remediation: `Configurar MTA-STS: crear registro TXT en _mta-sts.${domain} y alojar la política en https://mta-sts.${domain}/.well-known/mta-sts.txt`,
        cveId: null,
      });
    }

    // 7. TLSRPT
    const tlsRptRecords = await safeResolveTxt(`_smtp._tls.${domain}`);
    const tlsRpt = tlsRptRecords.find((t) => t.includes("v=TLSRPTv1"));

    if (tlsRpt) {
      score += 5;
      findings.push({
        title: "TLS-RPT configurado",
        description: `El dominio ${domain} tiene TLS-RPT para recibir reportes de problemas de entrega TLS.`,
        severity: "info",
        cvssScore: 0,
        remediation: null,
        cveId: null,
      });
    }

    // Calculate final score and grade
    score = Math.min(score, maxScore);
    let grade: string;
    let gradeSeverity: FindingData["severity"];

    if (score >= 80) { grade = "A"; gradeSeverity = "info"; }
    else if (score >= 60) { grade = "B"; gradeSeverity = "info"; }
    else if (score >= 40) { grade = "C"; gradeSeverity = "low"; }
    else if (score >= 20) { grade = "D"; gradeSeverity = "medium"; }
    else { grade = "F"; gradeSeverity = "high"; }

    findings.push({
      title: `Puntuación de seguridad email: ${score}/100 (${grade})`,
      description: `El dominio ${domain} obtuvo una puntuación de ${score}/100 en seguridad de correo electrónico. Grado: ${grade}. La puntuación se basa en la configuración de SPF, DKIM, DMARC, BIMI, MTA-STS y registros MX.`,
      severity: gradeSeverity,
      cvssScore: grade === "F" ? 7.0 : grade === "D" ? 5.0 : grade === "C" ? 3.0 : 0,
      remediation: score < 80 ? "Implementar las recomendaciones de los hallazgos individuales para mejorar la seguridad del correo electrónico." : null,
      cveId: null,
    });
  } catch (err: any) {
    findings.push({
      title: "Error en análisis de seguridad email",
      description: `No se pudo analizar la seguridad de correo de ${domain}. Error: ${err.message}`,
      severity: "medium",
      cvssScore: 5.0,
      remediation: "Verificar que el dominio es válido.",
      cveId: null,
    });
  }

  return findings;
}
