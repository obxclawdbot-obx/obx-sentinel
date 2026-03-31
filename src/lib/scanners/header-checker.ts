import * as https from "https";
import * as http from "http";
import type { FindingData } from "./types";

interface HeaderCheck {
  header: string;
  label: string;
  severity: FindingData["severity"];
  cvssScore: number;
  description: string;
  remediation: string;
}

const SECURITY_HEADERS: HeaderCheck[] = [
  {
    header: "strict-transport-security",
    label: "Strict-Transport-Security (HSTS)",
    severity: "medium",
    cvssScore: 5.4,
    description:
      "Sin HSTS, los usuarios pueden ser víctimas de ataques man-in-the-middle mediante downgrade de HTTPS a HTTP.",
    remediation:
      'Añadir cabecera: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
  },
  {
    header: "x-frame-options",
    label: "X-Frame-Options",
    severity: "medium",
    cvssScore: 4.3,
    description:
      "Sin X-Frame-Options, la página puede ser embebida en un iframe por un sitio malicioso (clickjacking).",
    remediation:
      "Añadir cabecera: X-Frame-Options: DENY o SAMEORIGIN",
  },
  {
    header: "x-content-type-options",
    label: "X-Content-Type-Options",
    severity: "low",
    cvssScore: 3.1,
    description:
      "Sin esta cabecera, el navegador puede interpretar archivos con un MIME type incorrecto (MIME sniffing).",
    remediation: "Añadir cabecera: X-Content-Type-Options: nosniff",
  },
  {
    header: "content-security-policy",
    label: "Content-Security-Policy (CSP)",
    severity: "medium",
    cvssScore: 5.4,
    description:
      "Sin CSP, no hay protección contra inyección de scripts maliciosos (XSS).",
    remediation:
      "Configurar una Content-Security-Policy adecuada. Empezar con modo report-only para identificar recursos.",
  },
  {
    header: "referrer-policy",
    label: "Referrer-Policy",
    severity: "low",
    cvssScore: 3.1,
    description:
      "Sin Referrer-Policy, el navegador puede filtrar URLs completas (incluyendo parámetros sensibles) a sitios externos.",
    remediation:
      "Añadir cabecera: Referrer-Policy: strict-origin-when-cross-origin",
  },
  {
    header: "permissions-policy",
    label: "Permissions-Policy",
    severity: "low",
    cvssScore: 2.6,
    description:
      "Sin Permissions-Policy, el sitio no restringe el acceso a APIs del navegador (cámara, micrófono, geolocalización).",
    remediation:
      'Añadir cabecera: Permissions-Policy: camera=(), microphone=(), geolocation=()',
  },
];

function fetchHeaders(
  url: string
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const req = client.get(
      url,
      {
        timeout: 10000,
        headers: {
          "User-Agent": "OBX-Sentinel/1.0 Security Scanner",
        },
        // Don't follow redirects manually — just check the first response
        rejectUnauthorized: false,
      },
      (res) => {
        // Consume body to free socket
        res.resume();
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout conectando a " + url));
    });
    req.on("error", (err) => reject(err));
  });
}

export async function scanHeaders(url: string): Promise<FindingData[]> {
  const findings: FindingData[] = [];

  try {
    // Normalize URL
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const { statusCode, headers } = await fetchHeaders(url);

    // Check HTTP to HTTPS redirect
    if (url.startsWith("http://")) {
      const location = headers.location || "";
      if (!location.startsWith("https://")) {
        findings.push({
          title: "Sin redirección HTTP a HTTPS",
          description: `El sitio ${url} no redirige automáticamente a HTTPS. Los usuarios que accedan por HTTP enviarán datos sin cifrar.`,
          severity: "medium",
          cvssScore: 5.4,
          remediation:
            "Configurar redirección 301 de HTTP a HTTPS en el servidor web.",
          cveId: null,
        });
      }
    }

    // Check missing security headers
    for (const check of SECURITY_HEADERS) {
      if (!headers[check.header]) {
        findings.push({
          title: `Cabecera ${check.label} ausente`,
          description: `${check.description} URL: ${url}`,
          severity: check.severity,
          cvssScore: check.cvssScore,
          remediation: check.remediation,
          cveId: null,
        });
      }
    }

    // Information disclosure: Server header
    const serverHeader = Array.isArray(headers["server"]) ? headers["server"][0] : headers["server"];
    if (serverHeader) {
      // Check if it reveals version info
      const hasVersion = /[\d.]+/.test(serverHeader);
      if (hasVersion) {
        findings.push({
          title: "Versión del servidor web expuesta",
          description: `El servidor revela su identidad y versión: "${serverHeader}". Esta información facilita la búsqueda de vulnerabilidades específicas.`,
          severity: "low",
          cvssScore: 3.7,
          remediation:
            "Configurar el servidor web para no revelar la versión. En Nginx: server_tokens off; En Apache: ServerTokens Prod.",
          cveId: null,
        });
      } else {
        findings.push({
          title: "Cabecera Server presente",
          description: `El servidor envía la cabecera Server: "${serverHeader}". Aunque no revela la versión, identifica el software.`,
          severity: "info",
          cvssScore: 2.0,
          remediation:
            "Considerar eliminar la cabecera Server o reducir su contenido.",
          cveId: null,
        });
      }
    }

    // X-Powered-By
    const poweredBy = Array.isArray(headers["x-powered-by"]) ? headers["x-powered-by"][0] : headers["x-powered-by"];
    if (poweredBy) {
      findings.push({
        title: "Cabecera X-Powered-By revela tecnología",
        description: `El servidor revela la tecnología utilizada: "${poweredBy}". Esta información facilita ataques dirigidos.`,
        severity: "low",
        cvssScore: 3.7,
        remediation:
          "Eliminar la cabecera X-Powered-By. En Express.js: app.disable('x-powered-by').",
        cveId: null,
      });
    }

    // Check for good headers present
    const goodHeaders = SECURITY_HEADERS.filter((h) => headers[h.header]);
    if (goodHeaders.length > 0) {
      findings.push({
        title: `${goodHeaders.length} cabecera(s) de seguridad configurada(s)`,
        description: `Cabeceras de seguridad presentes: ${goodHeaders.map((h) => h.label).join(", ")}`,
        severity: "info",
        cvssScore: 0,
        remediation: null,
        cveId: null,
      });
    }
  } catch (err: any) {
    findings.push({
      title: "Error al verificar cabeceras HTTP",
      description: `No se pudo conectar a ${url} para verificar las cabeceras de seguridad. Error: ${err.message}`,
      severity: "medium",
      cvssScore: 5.0,
      remediation: "Verificar que la URL es accesible.",
      cveId: null,
    });
  }

  return findings;
}
