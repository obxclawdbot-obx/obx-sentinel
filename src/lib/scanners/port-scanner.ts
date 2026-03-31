import * as net from "net";
import type { FindingData } from "./types";

interface PortInfo {
  port: number;
  name: string;
  risky: boolean;
  severity: FindingData["severity"];
  cvssScore: number;
  description: string;
  remediation: string;
}

const PORTS: PortInfo[] = [
  {
    port: 21,
    name: "FTP",
    risky: true,
    severity: "high",
    cvssScore: 7.0,
    description:
      "FTP transmite credenciales en texto plano y es objetivo frecuente de ataques de fuerza bruta.",
    remediation:
      "Deshabilitar FTP y usar SFTP (SSH File Transfer) en su lugar. Si FTP es necesario, restringir por IP.",
  },
  {
    port: 22,
    name: "SSH",
    risky: false,
    severity: "medium",
    cvssScore: 5.3,
    description:
      "SSH está expuesto a Internet. Aunque es más seguro que Telnet, sigue siendo objetivo de ataques de fuerza bruta.",
    remediation:
      "Restringir acceso SSH por IP mediante firewall. Usar autenticación por clave pública. Considerar fail2ban.",
  },
  {
    port: 23,
    name: "Telnet",
    risky: true,
    severity: "critical",
    cvssScore: 9.1,
    description:
      "Telnet transmite todo el tráfico en texto plano, incluyendo contraseñas. Es extremadamente inseguro.",
    remediation:
      "Deshabilitar Telnet completamente. Usar SSH como alternativa segura.",
  },
  {
    port: 25,
    name: "SMTP",
    risky: false,
    severity: "info",
    cvssScore: 3.0,
    description:
      "Servidor SMTP detectado. Si es un servidor de correo legítimo, es normal.",
    remediation:
      "Verificar que el servidor SMTP requiere autenticación y soporta STARTTLS.",
  },
  {
    port: 80,
    name: "HTTP",
    risky: false,
    severity: "info",
    cvssScore: 0,
    description: "Servidor web HTTP detectado.",
    remediation: "Asegurar redirección a HTTPS.",
  },
  {
    port: 443,
    name: "HTTPS",
    risky: false,
    severity: "info",
    cvssScore: 0,
    description: "Servidor web HTTPS detectado.",
    remediation: null as any,
  },
  {
    port: 3306,
    name: "MySQL",
    risky: true,
    severity: "critical",
    cvssScore: 9.1,
    description:
      "Base de datos MySQL expuesta a Internet. Permite ataques directos contra la base de datos.",
    remediation:
      "Bloquear el puerto 3306 en el firewall. La base de datos solo debe ser accesible desde la red interna o localhost.",
  },
  {
    port: 5432,
    name: "PostgreSQL",
    risky: true,
    severity: "critical",
    cvssScore: 9.1,
    description:
      "Base de datos PostgreSQL expuesta a Internet. Permite ataques directos contra la base de datos.",
    remediation:
      "Bloquear el puerto 5432 en el firewall. Configurar pg_hba.conf para restringir conexiones.",
  },
  {
    port: 6379,
    name: "Redis",
    risky: true,
    severity: "critical",
    cvssScore: 9.8,
    description:
      "Redis expuesto a Internet. Redis por defecto no tiene autenticación, permitiendo acceso total a los datos y ejecución remota de comandos.",
    remediation:
      "Bloquear el puerto 6379 en el firewall. Configurar requirepass en Redis. Nunca exponer Redis a Internet.",
  },
  {
    port: 8080,
    name: "HTTP-Alt",
    risky: false,
    severity: "low",
    cvssScore: 3.0,
    description:
      "Servicio HTTP alternativo detectado en puerto 8080. Puede ser un panel de administración o proxy.",
    remediation:
      "Verificar qué servicio corre en este puerto. Si no es necesario, cerrar.",
  },
  {
    port: 27017,
    name: "MongoDB",
    risky: true,
    severity: "critical",
    cvssScore: 9.8,
    description:
      "MongoDB expuesto a Internet. Históricamente, miles de instancias MongoDB sin autenticación han sido comprometidas.",
    remediation:
      "Bloquear el puerto 27017 en el firewall. Habilitar autenticación en MongoDB. Nunca exponer MongoDB a Internet.",
  },
];

function checkPort(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    const done = (open: boolean) => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(open);
      }
    };

    socket.setTimeout(timeoutMs);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
    socket.connect(port, host);
  });
}

export async function scanPorts(host: string): Promise<FindingData[]> {
  const findings: FindingData[] = [];

  try {
    // Scan all ports in parallel
    const results = await Promise.all(
      PORTS.map(async (portInfo) => ({
        ...portInfo,
        open: await checkPort(host, portInfo.port),
      }))
    );

    const openPorts = results.filter((r) => r.open);

    if (openPorts.length === 0) {
      findings.push({
        title: "No se detectaron puertos abiertos",
        description: `No se encontraron puertos abiertos en ${host} de los ${PORTS.length} puertos comunes escaneados. El host puede estar protegido por un firewall o no accesible.`,
        severity: "info",
        cvssScore: 0,
        remediation: null,
        cveId: null,
      });
      return findings;
    }

    // Summary
    findings.push({
      title: `${openPorts.length} puerto(s) abierto(s) detectado(s)`,
      description: `Puertos abiertos en ${host}: ${openPorts.map((p) => `${p.port}/${p.name}`).join(", ")}`,
      severity: "info",
      cvssScore: 0,
      remediation: null,
      cveId: null,
    });

    // Individual findings for risky or notable ports
    for (const port of openPorts) {
      if (port.risky) {
        findings.push({
          title: `Puerto ${port.name} (${port.port}) expuesto a Internet`,
          description: `${port.description} Host: ${host}.`,
          severity: port.severity,
          cvssScore: port.cvssScore,
          remediation: port.remediation,
          cveId: null,
        });
      } else if (port.severity !== "info") {
        findings.push({
          title: `Puerto ${port.name} (${port.port}) abierto`,
          description: `${port.description} Host: ${host}.`,
          severity: port.severity,
          cvssScore: port.cvssScore,
          remediation: port.remediation,
          cveId: null,
        });
      }
    }
  } catch (err: any) {
    findings.push({
      title: "Error al escanear puertos",
      description: `No se pudo completar el escaneo de puertos de ${host}. Error: ${err.message}`,
      severity: "medium",
      cvssScore: 5.0,
      remediation: "Verificar que el host es accesible.",
      cveId: null,
    });
  }

  return findings;
}
