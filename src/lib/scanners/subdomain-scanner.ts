import * as dns from "dns";
import { promisify } from "util";
import type { FindingData } from "./types";

const resolve4 = promisify(dns.resolve4);

const COMMON_SUBDOMAINS = [
  "www", "mail", "ftp", "admin", "api", "dev", "staging", "test", "beta",
  "portal", "vpn", "remote", "webmail", "blog", "shop", "store", "app",
  "m", "mobile", "cdn", "static", "media", "img", "assets", "ns1", "ns2",
  "mx", "smtp", "pop", "imap", "cpanel", "whm", "plesk", "phpmyadmin",
  "dashboard", "panel", "login", "auth", "sso", "git", "gitlab", "jenkins",
  "ci", "monitor", "grafana", "status", "docs", "wiki", "jira", "confluence",
  "support", "help",
];

const RISKY_SUBDOMAINS = new Set([
  "admin", "cpanel", "whm", "plesk", "phpmyadmin", "dashboard", "panel",
  "login", "git", "gitlab", "jenkins", "ci", "grafana", "jira", "staging",
  "test", "dev", "remote", "vpn", "sso", "auth", "monitor",
]);

async function checkSubdomain(subdomain: string, domain: string): Promise<{ sub: string; ips: string[] } | null> {
  try {
    const fqdn = `${subdomain}.${domain}`;
    const ips = await resolve4(fqdn);
    return { sub: subdomain, ips };
  } catch {
    return null;
  }
}

async function processBatch(
  subdomains: string[],
  domain: string
): Promise<{ sub: string; ips: string[] }[]> {
  const results = await Promise.all(
    subdomains.map((s) => checkSubdomain(s, domain))
  );
  return results.filter((r): r is { sub: string; ips: string[] } => r !== null);
}

export async function scanSubdomains(domain: string): Promise<FindingData[]> {
  const findings: FindingData[] = [];

  try {
    // Clean domain
    domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    const found: { sub: string; ips: string[] }[] = [];
    const batchSize = 10;

    // Process in parallel batches of 10
    for (let i = 0; i < COMMON_SUBDOMAINS.length; i += batchSize) {
      const batch = COMMON_SUBDOMAINS.slice(i, i + batchSize);
      const results = await processBatch(batch, domain);
      found.push(...results);
    }

    if (found.length === 0) {
      findings.push({
        title: "No se encontraron subdominios comunes",
        description: `No se detectaron subdominios comunes activos para ${domain}.`,
        severity: "info",
        cvssScore: 0,
        remediation: null,
        cveId: null,
      });
      return findings;
    }

    // Report risky subdomains individually
    const riskyFound = found.filter((f) => RISKY_SUBDOMAINS.has(f.sub));
    const safeFound = found.filter((f) => !RISKY_SUBDOMAINS.has(f.sub));

    for (const r of riskyFound) {
      const fqdn = `${r.sub}.${domain}`;
      const isHighRisk = ["phpmyadmin", "cpanel", "whm", "plesk", "jenkins", "git", "gitlab"].includes(r.sub);

      findings.push({
        title: `Subdominio sensible activo: ${fqdn}`,
        description: `El subdominio ${fqdn} (${r.ips.join(", ")}) está activo y apunta a un servicio potencialmente sensible. Si es accesible públicamente, podría ser un vector de ataque.`,
        severity: isHighRisk ? "high" : "medium",
        cvssScore: isHighRisk ? 7.5 : 5.3,
        remediation: `Verificar que ${fqdn} requiere autenticación, no expone paneles de administración públicamente y está protegido por firewall o VPN. Si no se utiliza, eliminar el registro DNS.`,
        cveId: null,
      });
    }

    // Summary of all found subdomains
    const allSubs = found.map((f) => `${f.sub}.${domain}`);
    findings.push({
      title: `${found.length} subdominio(s) descubierto(s)`,
      description: `Subdominios activos encontrados para ${domain}: ${allSubs.join(", ")}`,
      severity: "info",
      cvssScore: 0,
      remediation: riskyFound.length > 0
        ? "Revisar los subdominios sensibles detectados y asegurar que no expongan servicios internos."
        : null,
      cveId: null,
    });

    // Check for consistent IPs (possible wildcard DNS)
    const uniqueIps = new Set(found.flatMap((f) => f.ips));
    if (found.length > 10 && uniqueIps.size === 1) {
      findings.push({
        title: "Posible DNS wildcard detectado",
        description: `Todos los ${found.length} subdominios encontrados resuelven a la misma IP (${Array.from(uniqueIps)[0]}). Esto podría indicar un registro DNS wildcard (*.${domain}).`,
        severity: "low",
        cvssScore: 2.0,
        remediation: "Un DNS wildcard puede exponer servicios no intencionados. Considerar usar registros DNS específicos.",
        cveId: null,
      });
    }
  } catch (err: any) {
    findings.push({
      title: "Error en escaneo de subdominios",
      description: `No se pudieron verificar los subdominios de ${domain}. Error: ${err.message}`,
      severity: "medium",
      cvssScore: 5.0,
      remediation: "Verificar que el dominio es válido.",
      cveId: null,
    });
  }

  return findings;
}
