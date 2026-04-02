import * as https from "https";
import * as http from "http";
import type { FindingData } from "./types";

interface WAFSignature {
  name: string;
  checks: {
    headers?: Record<string, RegExp>;
    cookies?: RegExp;
    statusBehavior?: boolean;
  };
}

const WAF_SIGNATURES: WAFSignature[] = [
  {
    name: "Cloudflare",
    checks: {
      headers: {
        server: /cloudflare/i,
        "cf-ray": /.+/,
      },
    },
  },
  {
    name: "AWS WAF / CloudFront",
    checks: {
      headers: {
        "x-amz-cf-id": /.+/,
        "x-amzn-waf-action": /.+/,
      },
    },
  },
  {
    name: "Akamai",
    checks: {
      headers: {
        "x-akamai-transformed": /.+/,
        "x-akamai-request-id": /.+/,
      },
    },
  },
  {
    name: "Sucuri",
    checks: {
      headers: {
        "x-sucuri-id": /.+/,
        server: /sucuri/i,
      },
    },
  },
  {
    name: "Imperva / Incapsula",
    checks: {
      headers: {
        "x-iinfo": /.+/,
        "x-cdn": /incapsula/i,
      },
      cookies: /incap_ses|visid_incap/i,
    },
  },
  {
    name: "ModSecurity",
    checks: {
      headers: {
        server: /mod_security|modsecurity/i,
      },
    },
  },
  {
    name: "F5 BIG-IP ASM",
    checks: {
      headers: {
        server: /big-ip/i,
        "x-wa-info": /.+/,
      },
      cookies: /BIGipServer/i,
    },
  },
  {
    name: "Barracuda",
    checks: {
      headers: {
        server: /barracuda/i,
      },
    },
  },
  {
    name: "DDoS-Guard",
    checks: {
      headers: {
        server: /ddos-guard/i,
      },
    },
  },
];

function httpRequest(
  url: string
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; cookies: string[] }> {
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
          statusCode: res.statusCode || 0,
          headers: res.headers,
          cookies: res.headers["set-cookie"] || [],
        });
      }
    );

    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    req.on("error", reject);
  });
}

export async function scanWAF(url: string): Promise<FindingData[]> {
  const findings: FindingData[] = [];

  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    // Normal request
    const normalResp = await httpRequest(url);
    const detectedWAFs: string[] = [];
    const cookieStr = normalResp.cookies.join(" ");

    for (const sig of WAF_SIGNATURES) {
      let detected = false;

      if (sig.checks.headers) {
        for (const [header, regex] of Object.entries(sig.checks.headers)) {
          const val = normalResp.headers[header];
          const headerVal = Array.isArray(val) ? val.join(" ") : val;
          if (headerVal && regex.test(headerVal)) {
            detected = true;
            break;
          }
        }
      }

      if (!detected && sig.checks.cookies) {
        if (sig.checks.cookies.test(cookieStr)) {
          detected = true;
        }
      }

      if (detected) {
        detectedWAFs.push(sig.name);
      }
    }

    // Try a suspicious request to detect WAF blocking
    let wafBlocked = false;
    try {
      const suspiciousUrl = new URL(url);
      suspiciousUrl.searchParams.set("id", "1' OR '1'='1");
      const suspResp = await httpRequest(suspiciousUrl.toString());

      if ([403, 406, 429, 503].includes(suspResp.statusCode)) {
        wafBlocked = true;
      }

      // Check if response has WAF block indicators
      for (const sig of WAF_SIGNATURES) {
        if (sig.checks.headers) {
          for (const [header, regex] of Object.entries(sig.checks.headers)) {
            const val = suspResp.headers[header];
            const headerVal = Array.isArray(val) ? val.join(" ") : val;
            if (headerVal && regex.test(headerVal) && !detectedWAFs.includes(sig.name)) {
              detectedWAFs.push(sig.name);
            }
          }
        }
      }
    } catch {
      // Timeout or connection reset on suspicious request could also indicate WAF
      wafBlocked = true;
    }

    if (detectedWAFs.length > 0) {
      findings.push({
        title: `WAF detectado: ${detectedWAFs.join(", ")}`,
        description: `Se detectó la presencia de un Web Application Firewall (WAF) en ${url}: ${detectedWAFs.join(", ")}. Un WAF proporciona una capa adicional de protección contra ataques web.`,
        severity: "info",
        cvssScore: 0,
        remediation: null,
        cveId: null,
      });

      if (wafBlocked) {
        findings.push({
          title: "WAF bloquea solicitudes sospechosas",
          description: `El WAF bloqueó activamente una solicitud con patrón de inyección SQL. Esto confirma que el WAF está configurado para filtrar tráfico malicioso.`,
          severity: "info",
          cvssScore: 0,
          remediation: null,
          cveId: null,
        });
      }
    } else if (wafBlocked) {
      findings.push({
        title: "Posible WAF detectado (bloqueo de solicitudes)",
        description: `Aunque no se identificó un WAF específico por cabeceras, el servidor bloqueó una solicitud sospechosa, lo que sugiere algún tipo de protección contra ataques.`,
        severity: "info",
        cvssScore: 0,
        remediation: null,
        cveId: null,
      });
    } else {
      findings.push({
        title: "No se detectó WAF (Web Application Firewall)",
        description: `No se detectó ningún Web Application Firewall protegiendo ${url}. Sin un WAF, el sitio depende únicamente de la seguridad de la aplicación para defenderse de ataques web (SQLi, XSS, etc.).`,
        severity: "medium",
        cvssScore: 5.3,
        remediation: "Considerar implementar un WAF como Cloudflare, AWS WAF, o ModSecurity para añadir una capa de protección contra ataques web comunes.",
        cveId: null,
      });
    }
  } catch (err: any) {
    findings.push({
      title: "Error en detección de WAF",
      description: `No se pudo analizar ${url} para detectar WAF. Error: ${err.message}`,
      severity: "medium",
      cvssScore: 5.0,
      remediation: "Verificar que la URL es accesible.",
      cveId: null,
    });
  }

  return findings;
}
