import * as https from "https";
import type { FindingData } from "./types";

interface HIBPBreach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  AddedDate: string;
  ModifiedDate: string;
  PwnCount: number;
  Description: string;
  DataClasses: string[];
  IsVerified: boolean;
  IsFabricated: boolean;
  IsSensitive: boolean;
  IsRetired: boolean;
  IsSpamList: boolean;
  LogoPath: string;
}

function fetchJSON(url: string): Promise<HIBPBreach[]> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        timeout: 10000,
        headers: {
          "User-Agent": "OBX-Sentinel/1.0 Security Scanner",
          Accept: "application/json",
        },
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try {
            if (res.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`HTTP ${res.statusCode}`));
            }
          } catch (e) {
            reject(new Error("Error parseando respuesta JSON"));
          }
        });
      }
    );

    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    req.on("error", reject);
  });
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export async function scanLeaked(domain: string): Promise<FindingData[]> {
  const findings: FindingData[] = [];

  try {
    domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();

    // Fetch all breaches from HIBP public API (no auth needed)
    let breaches: HIBPBreach[];
    try {
      breaches = await fetchJSON("https://haveibeenpwned.com/api/v3/breaches");
    } catch (err: any) {
      findings.push({
        title: "No se pudo consultar base de datos de brechas",
        description: `Error al consultar HaveIBeenPwned para verificar brechas del dominio ${domain}. Error: ${err.message}`,
        severity: "info",
        cvssScore: 0,
        remediation: "Verificar manualmente en https://haveibeenpwned.com si el dominio ha sufrido brechas de datos.",
        cveId: null,
      });
      return findings;
    }

    // Filter breaches matching this domain
    const domainBreaches = breaches.filter(
      (b) =>
        b.Domain &&
        b.Domain.toLowerCase() === domain &&
        !b.IsSpamList &&
        !b.IsFabricated &&
        !b.IsRetired
    );

    if (domainBreaches.length === 0) {
      // Also check if domain appears as substring (e.g., subdomains)
      const relatedBreaches = breaches.filter(
        (b) =>
          b.Domain &&
          (b.Domain.toLowerCase().endsWith(`.${domain}`) || domain.endsWith(`.${b.Domain.toLowerCase()}`)) &&
          !b.IsSpamList &&
          !b.IsFabricated &&
          !b.IsRetired
      );

      if (relatedBreaches.length > 0) {
        for (const breach of relatedBreaches) {
          findings.push({
            title: `Brecha relacionada: ${breach.Title}`,
            description: `Se encontró una brecha de datos en un dominio relacionado (${breach.Domain}). Brecha: "${breach.Title}" (${breach.BreachDate}). ${formatNumber(breach.PwnCount)} cuentas afectadas. Datos expuestos: ${breach.DataClasses.join(", ")}.`,
            severity: "medium",
            cvssScore: 5.3,
            remediation: "Verificar si hay cuentas de la organización afectadas. Forzar cambio de contraseñas si es necesario.",
            cveId: null,
          });
        }
      } else {
        findings.push({
          title: "No se encontraron brechas de datos conocidas",
          description: `El dominio ${domain} no aparece en la base de datos de brechas conocidas de HaveIBeenPwned. Esto no garantiza que no haya habido brechas no reportadas.`,
          severity: "info",
          cvssScore: 0,
          remediation: null,
          cveId: null,
        });
      }
    } else {
      // Domain found in breaches
      for (const breach of domainBreaches) {
        const dataClasses = breach.DataClasses.join(", ");
        const hasPasswords = breach.DataClasses.some((d) =>
          /password|hash/i.test(d)
        );
        const hasSensitive = breach.DataClasses.some((d) =>
          /credit|card|financial|ssn|passport|health/i.test(d)
        );

        let severity: FindingData["severity"] = "high";
        let cvss = 7.5;

        if (hasPasswords && hasSensitive) {
          severity = "critical";
          cvss = 9.1;
        } else if (hasPasswords) {
          severity = "critical";
          cvss = 8.6;
        } else if (hasSensitive) {
          severity = "critical";
          cvss = 8.2;
        }

        findings.push({
          title: `Brecha de datos: ${breach.Title}`,
          description: `El dominio ${domain} sufrió una brecha de datos conocida: "${breach.Title}" (${breach.BreachDate}). ${formatNumber(breach.PwnCount)} cuentas afectadas. Datos expuestos: ${dataClasses}. ${breach.IsVerified ? "Brecha verificada." : "Brecha no verificada."}`,
          severity,
          cvssScore: cvss,
          remediation: `1. Notificar a los usuarios afectados. 2. Forzar cambio de contraseñas${hasPasswords ? " (se filtraron contraseñas)" : ""}. 3. Revisar el acceso a cuentas desde la fecha de la brecha (${breach.BreachDate}). 4. Implementar MFA si no está activo.`,
          cveId: null,
        });
      }

      // Summary
      const totalAffected = domainBreaches.reduce((sum, b) => sum + b.PwnCount, 0);
      findings.push({
        title: `${domainBreaches.length} brecha(s) encontrada(s) para ${domain}`,
        description: `El dominio ${domain} aparece en ${domainBreaches.length} brecha(s) de datos conocidas. Total de cuentas afectadas: ${formatNumber(totalAffected)}.`,
        severity: "info",
        cvssScore: 0,
        remediation: "Realizar una auditoría completa de seguridad y revisar las políticas de protección de datos.",
        cveId: null,
      });
    }
  } catch (err: any) {
    findings.push({
      title: "Error en verificación de brechas",
      description: `No se pudo verificar si ${domain} ha sufrido brechas de datos. Error: ${err.message}`,
      severity: "medium",
      cvssScore: 5.0,
      remediation: "Verificar manualmente en https://haveibeenpwned.com",
      cveId: null,
    });
  }

  return findings;
}
