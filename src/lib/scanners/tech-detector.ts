import * as https from "https";
import * as http from "http";
import type { FindingData } from "./types";

interface TechSignature {
  name: string;
  category: string;
  patterns: {
    headers?: Record<string, RegExp>;
    meta?: RegExp;
    scripts?: RegExp[];
    cookies?: RegExp[];
    html?: RegExp[];
  };
  outdatedVersions?: { pattern: RegExp; severity: FindingData["severity"]; cvss: number; note: string }[];
}

const TECH_SIGNATURES: TechSignature[] = [
  {
    name: "WordPress",
    category: "CMS",
    patterns: {
      meta: /content=["']WordPress/i,
      scripts: [/\/wp-content\//i, /\/wp-includes\//i],
      html: [/wp-json/i, /<link[^>]+s\.w\.org/i],
    },
    outdatedVersions: [
      { pattern: /WordPress\s+([0-4]\.\d)/i, severity: "high", cvss: 7.5, note: "Versión muy antigua de WordPress con múltiples vulnerabilidades conocidas" },
    ],
  },
  {
    name: "jQuery",
    category: "Librería JS",
    patterns: {
      scripts: [/jquery[.-](\d+\.\d+[\d.]*)/i, /jquery\.min\.js/i, /code\.jquery\.com/i],
    },
    outdatedVersions: [
      { pattern: /jquery[.-](1\.\d)/i, severity: "medium", cvss: 5.3, note: "jQuery 1.x contiene vulnerabilidades XSS conocidas (CVE-2020-11022/23)" },
      { pattern: /jquery[.-](2\.\d)/i, severity: "medium", cvss: 4.3, note: "jQuery 2.x está sin soporte y contiene vulnerabilidades conocidas" },
    ],
  },
  {
    name: "React",
    category: "Framework JS",
    patterns: {
      scripts: [/react[\.-](?:dom)?/i, /\/react@/i],
      html: [/data-reactroot/i, /__NEXT_DATA__/i],
    },
  },
  {
    name: "Vue.js",
    category: "Framework JS",
    patterns: {
      scripts: [/vue[\.-](\d)/i, /\/vue@/i, /vuejs\.org/i],
      html: [/data-v-[a-f0-9]/i, /id="__nuxt"/i],
    },
  },
  {
    name: "Angular",
    category: "Framework JS",
    patterns: {
      scripts: [/angular[\.-]/i, /\/angular@/i],
      html: [/ng-version/i, /ng-app/i, /<app-root/i],
    },
  },
  {
    name: "Bootstrap",
    category: "Framework CSS",
    patterns: {
      scripts: [/bootstrap[\.-](\d)/i, /getbootstrap\.com/i],
      html: [/class="[^"]*container-fluid/i],
    },
  },
  {
    name: "Nginx",
    category: "Servidor Web",
    patterns: {
      headers: { server: /nginx/i },
    },
  },
  {
    name: "Apache",
    category: "Servidor Web",
    patterns: {
      headers: { server: /apache/i },
    },
  },
  {
    name: "IIS",
    category: "Servidor Web",
    patterns: {
      headers: { server: /microsoft-iis/i },
    },
  },
  {
    name: "PHP",
    category: "Lenguaje",
    patterns: {
      headers: { "x-powered-by": /php/i },
      cookies: [/PHPSESSID/i],
    },
    outdatedVersions: [
      { pattern: /PHP\/([5-6]\.\d)/i, severity: "high", cvss: 7.5, note: "PHP 5.x/6.x está sin soporte con vulnerabilidades críticas conocidas" },
      { pattern: /PHP\/(7\.[0-3])/i, severity: "medium", cvss: 5.3, note: "Esta versión de PHP ya no recibe actualizaciones de seguridad" },
    ],
  },
  {
    name: "ASP.NET",
    category: "Framework",
    patterns: {
      headers: { "x-powered-by": /asp\.net/i, "x-aspnet-version": /.+/ },
      cookies: [/ASP\.NET_SessionId/i, /\.ASPXAUTH/i],
    },
  },
  {
    name: "Express.js",
    category: "Framework",
    patterns: {
      headers: { "x-powered-by": /express/i },
    },
  },
  {
    name: "Cloudflare",
    category: "CDN/WAF",
    patterns: {
      headers: { server: /cloudflare/i, "cf-ray": /.+/ },
    },
  },
  {
    name: "Google Analytics",
    category: "Analytics",
    patterns: {
      scripts: [/google-analytics\.com\/analytics/i, /googletagmanager\.com/i, /gtag\/js/i],
    },
  },
  {
    name: "Font Awesome",
    category: "Librería CSS",
    patterns: {
      scripts: [/font-?awesome/i, /fontawesome/i],
      html: [/class="[^"]*fa[rsb]?\s+fa-/i],
    },
  },
  {
    name: "Drupal",
    category: "CMS",
    patterns: {
      meta: /Drupal/i,
      html: [/Drupal\.settings/i, /\/sites\/default\/files/i],
    },
  },
  {
    name: "Joomla",
    category: "CMS",
    patterns: {
      meta: /Joomla/i,
      html: [/\/media\/jui\//i, /com_content/i],
    },
  },
  {
    name: "Next.js",
    category: "Framework JS",
    patterns: {
      html: [/__NEXT_DATA__/i, /_next\/static/i],
      headers: { "x-powered-by": /next\.js/i },
    },
  },
  {
    name: "Varnish",
    category: "Cache",
    patterns: {
      headers: { via: /varnish/i, "x-varnish": /.+/ },
    },
  },
];

function fetchPage(url: string): Promise<{ headers: http.IncomingHttpHeaders; body: string; cookies: string[] }> {
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
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          if (body.length < 200000) body += chunk;
        });
        res.on("end", () => {
          const cookies: string[] = [];
          const setCookie = res.headers["set-cookie"];
          if (setCookie) cookies.push(...setCookie);
          resolve({ headers: res.headers, body, cookies });
        });
      }
    );

    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    req.on("error", reject);
  });
}

export async function scanTech(url: string): Promise<FindingData[]> {
  const findings: FindingData[] = [];

  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const { headers, body, cookies } = await fetchPage(url);
    const detectedTechs: { name: string; category: string; version?: string }[] = [];

    for (const sig of TECH_SIGNATURES) {
      let detected = false;

      // Check headers
      if (sig.patterns.headers) {
        for (const [header, regex] of Object.entries(sig.patterns.headers)) {
          const val = headers[header];
          const headerVal = Array.isArray(val) ? val.join(" ") : val;
          if (headerVal && regex.test(headerVal)) {
            detected = true;
            break;
          }
        }
      }

      // Check meta generator
      if (!detected && sig.patterns.meta) {
        const metaMatch = body.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i);
        if (metaMatch && sig.patterns.meta.test(metaMatch[1])) {
          detected = true;
        }
      }

      // Check scripts/links
      if (!detected && sig.patterns.scripts) {
        for (const regex of sig.patterns.scripts) {
          if (regex.test(body)) {
            detected = true;
            break;
          }
        }
      }

      // Check cookies
      if (!detected && sig.patterns.cookies) {
        const cookieStr = cookies.join(" ");
        for (const regex of sig.patterns.cookies) {
          if (regex.test(cookieStr)) {
            detected = true;
            break;
          }
        }
      }

      // Check HTML patterns
      if (!detected && sig.patterns.html) {
        for (const regex of sig.patterns.html) {
          if (regex.test(body)) {
            detected = true;
            break;
          }
        }
      }

      if (detected) {
        detectedTechs.push({ name: sig.name, category: sig.category });

        // Check outdated versions
        if (sig.outdatedVersions) {
          const fullText = body + " " + JSON.stringify(headers);
          for (const ov of sig.outdatedVersions) {
            if (ov.pattern.test(fullText)) {
              findings.push({
                title: `Versión obsoleta detectada: ${sig.name}`,
                description: `Se detectó una versión potencialmente vulnerable de ${sig.name} en ${url}. ${ov.note}.`,
                severity: ov.severity,
                cvssScore: ov.cvss,
                remediation: `Actualizar ${sig.name} a la última versión estable disponible.`,
                cveId: null,
              });
            }
          }
        }
      }
    }

    // Disclosure: X-Powered-By
    const poweredBy = headers["x-powered-by"];
    if (poweredBy) {
      findings.push({
        title: "Divulgación de tecnología via X-Powered-By",
        description: `La cabecera X-Powered-By revela: "${poweredBy}". Esta información facilita ataques dirigidos.`,
        severity: "low",
        cvssScore: 3.7,
        remediation: "Eliminar o enmascarar la cabecera X-Powered-By en la configuración del servidor.",
        cveId: null,
      });
    }

    // Disclosure: X-Generator
    const xGenerator = headers["x-generator"];
    if (xGenerator) {
      findings.push({
        title: "Divulgación de tecnología via X-Generator",
        description: `La cabecera X-Generator revela: "${xGenerator}".`,
        severity: "low",
        cvssScore: 3.7,
        remediation: "Eliminar la cabecera X-Generator de las respuestas del servidor.",
        cveId: null,
      });
    }

    // Summary
    if (detectedTechs.length > 0) {
      const grouped = detectedTechs.reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = [];
        acc[t.category].push(t.name);
        return acc;
      }, {} as Record<string, string[]>);

      const summary = Object.entries(grouped)
        .map(([cat, techs]) => `${cat}: ${techs.join(", ")}`)
        .join(" | ");

      findings.push({
        title: `${detectedTechs.length} tecnología(s) detectada(s)`,
        description: `Tecnologías identificadas en ${url}: ${summary}`,
        severity: "info",
        cvssScore: 0,
        remediation: null,
        cveId: null,
      });
    } else {
      findings.push({
        title: "No se detectaron tecnologías conocidas",
        description: `No se identificaron tecnologías conocidas en ${url}. El sitio puede estar usando tecnologías personalizadas o bien ofuscadas.`,
        severity: "info",
        cvssScore: 0,
        remediation: null,
        cveId: null,
      });
    }
  } catch (err: any) {
    findings.push({
      title: "Error en detección de tecnologías",
      description: `No se pudo analizar ${url} para detectar tecnologías. Error: ${err.message}`,
      severity: "medium",
      cvssScore: 5.0,
      remediation: "Verificar que la URL es accesible.",
      cveId: null,
    });
  }

  return findings;
}
