import * as https from "https";
import * as http from "http";
import type { FindingData } from "./types";

interface ParsedCookie {
  name: string;
  value: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string | null;
  expires: string | null;
  path: string | null;
  domain: string | null;
  hasSecurePrefix: boolean;
  hasHostPrefix: boolean;
}

function parseCookie(setCookieStr: string): ParsedCookie {
  const parts = setCookieStr.split(";").map((p) => p.trim());
  const [nameVal] = parts;
  const eqIdx = nameVal.indexOf("=");
  const name = eqIdx >= 0 ? nameVal.substring(0, eqIdx).trim() : nameVal.trim();
  const value = eqIdx >= 0 ? nameVal.substring(eqIdx + 1).trim() : "";

  const flags: Record<string, string> = {};
  for (let i = 1; i < parts.length; i++) {
    const fEq = parts[i].indexOf("=");
    if (fEq >= 0) {
      flags[parts[i].substring(0, fEq).trim().toLowerCase()] = parts[i].substring(fEq + 1).trim();
    } else {
      flags[parts[i].toLowerCase()] = "true";
    }
  }

  return {
    name,
    value,
    secure: "secure" in flags,
    httpOnly: "httponly" in flags,
    sameSite: flags["samesite"] || null,
    expires: flags["expires"] || null,
    path: flags["path"] || null,
    domain: flags["domain"] || null,
    hasSecurePrefix: name.startsWith("__Secure-"),
    hasHostPrefix: name.startsWith("__Host-"),
  };
}

function fetchCookies(url: string): Promise<{ cookies: string[]; isHttps: boolean }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const req = client.get(
      url,
      {
        timeout: 8000,
        headers: { "User-Agent": "OBX-Sentinel/1.0 Security Scanner" },
        rejectUnauthorized: false,
      },
      (res) => {
        res.resume();
        resolve({
          cookies: res.headers["set-cookie"] || [],
          isHttps: parsedUrl.protocol === "https:",
        });
      }
    );

    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    req.on("error", reject);
  });
}

export async function scanCookies(url: string): Promise<FindingData[]> {
  const findings: FindingData[] = [];

  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const { cookies, isHttps } = await fetchCookies(url);

    if (cookies.length === 0) {
      findings.push({
        title: "No se detectaron cookies",
        description: `El sitio ${url} no establece cookies en la respuesta inicial. Esto puede ser normal para sitios estáticos.`,
        severity: "info",
        cvssScore: 0,
        remediation: null,
        cveId: null,
      });
      return findings;
    }

    const parsed = cookies.map(parseCookie);
    let issuesCount = 0;

    for (const cookie of parsed) {
      const isSession = !cookie.expires && !cookie.name.toLowerCase().includes("consent") && !cookie.name.toLowerCase().includes("_ga");

      // Missing Secure flag
      if (!cookie.secure && isHttps) {
        issuesCount++;
        findings.push({
          title: `Cookie "${cookie.name}" sin flag Secure`,
          description: `La cookie "${cookie.name}" no tiene el atributo Secure. Puede ser transmitida en conexiones HTTP no cifradas, exponiendo su contenido.`,
          severity: isSession ? "medium" : "low",
          cvssScore: isSession ? 5.4 : 3.1,
          remediation: `Añadir el atributo Secure a la cookie "${cookie.name}" para que solo se envíe en conexiones HTTPS.`,
          cveId: null,
        });
      }

      // Missing HttpOnly flag
      if (!cookie.httpOnly) {
        const isSensitive = isSession ||
          /sess|token|auth|csrf|jwt/i.test(cookie.name);

        if (isSensitive) {
          issuesCount++;
          findings.push({
            title: `Cookie "${cookie.name}" sin flag HttpOnly`,
            description: `La cookie "${cookie.name}" parece ser sensible pero no tiene el atributo HttpOnly. Puede ser leída por JavaScript, facilitando ataques XSS.`,
            severity: "medium",
            cvssScore: 5.4,
            remediation: `Añadir el atributo HttpOnly a la cookie "${cookie.name}" para prevenir acceso desde JavaScript.`,
            cveId: null,
          });
        }
      }

      // Missing SameSite
      if (!cookie.sameSite) {
        issuesCount++;
        findings.push({
          title: `Cookie "${cookie.name}" sin atributo SameSite`,
          description: `La cookie "${cookie.name}" no define el atributo SameSite, lo que puede facilitar ataques CSRF en navegadores que no aplican "Lax" por defecto.`,
          severity: "low",
          cvssScore: 3.1,
          remediation: `Añadir SameSite=Lax o SameSite=Strict a la cookie "${cookie.name}".`,
          cveId: null,
        });
      } else if (cookie.sameSite.toLowerCase() === "none" && !cookie.secure) {
        issuesCount++;
        findings.push({
          title: `Cookie "${cookie.name}" con SameSite=None sin Secure`,
          description: `La cookie "${cookie.name}" tiene SameSite=None pero no tiene el flag Secure. Los navegadores modernos rechazarán esta cookie.`,
          severity: "medium",
          cvssScore: 4.3,
          remediation: `Añadir el atributo Secure a la cookie "${cookie.name}" o cambiar SameSite a Lax/Strict.`,
          cveId: null,
        });
      }

      // __Secure- prefix without Secure flag
      if (cookie.hasSecurePrefix && !cookie.secure) {
        issuesCount++;
        findings.push({
          title: `Cookie "${cookie.name}" usa prefijo __Secure- incorrectamente`,
          description: `La cookie usa el prefijo __Secure- pero no tiene el flag Secure activado. El navegador rechazará esta cookie.`,
          severity: "medium",
          cvssScore: 4.3,
          remediation: `Asegurar que la cookie "${cookie.name}" incluya el atributo Secure.`,
          cveId: null,
        });
      }

      // __Host- prefix requirements
      if (cookie.hasHostPrefix) {
        if (!cookie.secure || cookie.domain || cookie.path !== "/") {
          issuesCount++;
          findings.push({
            title: `Cookie "${cookie.name}" usa prefijo __Host- incorrectamente`,
            description: `La cookie usa el prefijo __Host- pero no cumple todos los requisitos: debe tener Secure, Path=/ y no definir Domain.`,
            severity: "medium",
            cvssScore: 4.3,
            remediation: `Asegurar que "${cookie.name}" tenga Secure, Path=/ y no defina el atributo Domain.`,
            cveId: null,
          });
        }
      }
    }

    // Summary
    findings.push({
      title: `${parsed.length} cookie(s) analizada(s)`,
      description: `Se encontraron ${parsed.length} cookie(s) en ${url}. ${issuesCount > 0 ? `Se detectaron ${issuesCount} problema(s) de seguridad.` : "Todas las cookies tienen una configuración de seguridad adecuada."}`,
      severity: "info",
      cvssScore: 0,
      remediation: null,
      cveId: null,
    });
  } catch (err: any) {
    findings.push({
      title: "Error al analizar cookies",
      description: `No se pudieron analizar las cookies de ${url}. Error: ${err.message}`,
      severity: "medium",
      cvssScore: 5.0,
      remediation: "Verificar que la URL es accesible.",
      cveId: null,
    });
  }

  return findings;
}
