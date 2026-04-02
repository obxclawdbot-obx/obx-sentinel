"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

interface FindingDetail {
  id: string;
  title: string;
  description: string;
  severity: string;
  cvssScore: number;
  status: string;
  cveId: string | null;
  remediation: string | null;
  detectedAt: string;
  resolvedAt: string | null;
  asset: { id: string; type: string; value: string };
  scan: { id: string; startedAt: string; completedAt: string | null } | null;
}

const severityColors: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
  info: "#3b82f6",
};

const severityLabels: Record<string, string> = {
  critical: "CRÍTICA",
  high: "ALTA",
  medium: "MEDIA",
  low: "BAJA",
  info: "INFO",
};

const statusLabels: Record<string, string> = {
  open: "Abierto",
  resolved: "Resuelto",
  accepted: "Aceptado",
  in_progress: "En progreso",
  false_positive: "Falso positivo",
};

function getCweReference(title: string): { id: string; name: string; url: string } | null {
  const lower = title.toLowerCase();
  if (lower.includes("header") || lower.includes("cabecera") || lower.includes("x-frame") || lower.includes("csp") || lower.includes("hsts") || lower.includes("x-content-type")) {
    return { id: "CWE-693", name: "Protection Mechanism Failure", url: "https://cwe.mitre.org/data/definitions/693.html" };
  }
  if (lower.includes("ssl") || lower.includes("tls") || lower.includes("certificado") || lower.includes("certificate") || lower.includes("cipher") || lower.includes("encryption")) {
    return { id: "CWE-326", name: "Inadequate Encryption Strength", url: "https://cwe.mitre.org/data/definitions/326.html" };
  }
  if (lower.includes("port") || lower.includes("puerto") || lower.includes("open service") || lower.includes("servicio abierto") || lower.includes("exposed")) {
    return { id: "CWE-200", name: "Information Exposure", url: "https://cwe.mitre.org/data/definitions/200.html" };
  }
  if (lower.includes("dns") || lower.includes("spf") || lower.includes("dkim") || lower.includes("dmarc") || lower.includes("nameserver")) {
    return { id: "CWE-350", name: "Reliance on Reverse DNS Resolution", url: "https://cwe.mitre.org/data/definitions/350.html" };
  }
  if (lower.includes("cookie") || lower.includes("session")) {
    return { id: "CWE-614", name: "Sensitive Cookie Without Secure Flag", url: "https://cwe.mitre.org/data/definitions/614.html" };
  }
  if (lower.includes("subdomain") || lower.includes("subdominio")) {
    return { id: "CWE-200", name: "Information Exposure", url: "https://cwe.mitre.org/data/definitions/200.html" };
  }
  if (lower.includes("waf") || lower.includes("firewall")) {
    return { id: "CWE-693", name: "Protection Mechanism Failure", url: "https://cwe.mitre.org/data/definitions/693.html" };
  }
  if (lower.includes("leak") || lower.includes("breach") || lower.includes("filtración") || lower.includes("brecha")) {
    return { id: "CWE-200", name: "Information Exposure", url: "https://cwe.mitre.org/data/definitions/200.html" };
  }
  return null;
}

function parseRemediation(text: string): string[] {
  // Try to parse numbered steps (1. xxx 2. xxx or 1) xxx)
  const numberedRegex = /(?:^|\n)\s*\d+[\.\)]\s+/;
  if (numberedRegex.test(text)) {
    return text
      .split(/(?:^|\n)\s*\d+[\.\)]\s+/)
      .filter((s) => s.trim().length > 0)
      .map((s) => s.trim().replace(/\n/g, " "));
  }
  // Try bullet points
  if (text.includes("\n- ") || text.includes("\n• ")) {
    return text
      .split(/\n[-•]\s+/)
      .filter((s) => s.trim().length > 0)
      .map((s) => s.trim().replace(/\n/g, " "));
  }
  // Try sentence split on periods followed by capital letters
  const sentences = text.split(/\.\s+(?=[A-ZÁÉÍÓÚ])/).filter((s) => s.trim().length > 0);
  if (sentences.length > 1) {
    return sentences.map((s) => s.trim().replace(/\.$/, "") + ".");
  }
  return [text];
}

export default function FindingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [finding, setFinding] = useState<FindingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/findings/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setFinding)
      .catch(() => router.push("/findings"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const updateStatus = async (newStatus: string) => {
    if (!finding) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/findings/${finding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFinding({ ...finding, ...updated });
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar />
        <main className="flex-1 p-8 bg-grid">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="skeleton h-8 w-64 rounded-lg" />
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-8">
              <div className="space-y-4">
                <div className="skeleton h-6 w-full" />
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-32 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!finding) return null;

  const color = severityColors[finding.severity] || "#888";
  const cwe = getCweReference(finding.title);
  const remediationSteps = finding.remediation ? parseRemediation(finding.remediation) : [];
  const cvssPercent = Math.min(100, (finding.cvssScore / 10) * 100);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 p-8 bg-grid">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <Link
            href="/findings"
            className="inline-flex items-center gap-2 text-sm text-[#888] hover:text-[#00ff88] transition-colors mb-6"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M10 3L5 8l5 5" />
            </svg>
            Volver a hallazgos
          </Link>

          {/* Header card */}
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-8 mb-6 animate-in">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Severity badge */}
              <span
                className="inline-flex px-3 py-1.5 text-xs font-bold rounded-full border shrink-0"
                style={{
                  backgroundColor: `${color}15`,
                  color: color,
                  borderColor: `${color}30`,
                }}
              >
                {severityLabels[finding.severity] || finding.severity.toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-[#f0f0f0] mb-2">{finding.title}</h1>
                <div className="flex flex-wrap gap-3 text-sm text-[#888]">
                  <span className="font-mono text-[#00ff88]">{finding.asset.value}</span>
                  {finding.cveId && (
                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${finding.cveId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3b82f6] hover:underline font-mono"
                    >
                      {finding.cveId}
                    </a>
                  )}
                  {cwe && (
                    <a
                      href={cwe.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#a78bfa] hover:underline"
                    >
                      {cwe.id}
                    </a>
                  )}
                </div>
              </div>

              {/* Status dropdown */}
              <div className="shrink-0">
                <select
                  value={finding.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={updating}
                  className="bg-[#111] border border-[#333] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00ff88] disabled:opacity-50"
                >
                  <option value="open">Abierto</option>
                  <option value="in_progress">En progreso</option>
                  <option value="resolved">Resuelto</option>
                  <option value="accepted">Aceptado</option>
                  <option value="false_positive">Falso positivo</option>
                </select>
              </div>
            </div>

            {/* CVSS Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#888] uppercase tracking-wider">CVSS Score</span>
                <span className="text-sm font-bold font-mono" style={{ color }}>{finding.cvssScore.toFixed(1)}</span>
              </div>
              <div className="w-full h-2.5 bg-[#222] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cvssPercent}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-[#555]">0</span>
                <span className="text-[10px] text-[#555]">10</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-8 mb-6 animate-in-delay-1">
            <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-3">Descripción</h2>
            <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">{finding.description}</p>
          </div>

          {/* Remediation */}
          {finding.remediation && (
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-8 mb-6 animate-in-delay-1">
              <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-4">
                Remediación
              </h2>
              {remediationSteps.length > 1 ? (
                <ol className="space-y-3">
                  {remediationSteps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm text-[#ccc] leading-relaxed pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-[#ccc] leading-relaxed">{finding.remediation}</p>
              )}
            </div>
          )}

          {/* CWE / OWASP Reference */}
          {cwe && (
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-8 mb-6 animate-in-delay-1">
              <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-3">Referencia CWE/OWASP</h2>
              <a
                href={cwe.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-4 py-3 bg-[#111] border border-[#333] rounded-xl hover:border-[#a78bfa] transition-colors group"
              >
                <span className="text-[#a78bfa] font-mono font-bold">{cwe.id}</span>
                <span className="text-sm text-[#888] group-hover:text-[#ccc] transition-colors">{cwe.name}</span>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-[#555]">
                  <path d="M5 3h8v8M13 3L3 13" />
                </svg>
              </a>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-8 animate-in-delay-1">
            <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-4">Detalles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#555]">Activo</span>
                <p className="text-[#f0f0f0] font-mono mt-0.5">{finding.asset.value}</p>
              </div>
              <div>
                <span className="text-[#555]">Tipo de activo</span>
                <p className="text-[#f0f0f0] mt-0.5 capitalize">{finding.asset.type}</p>
              </div>
              <div>
                <span className="text-[#555]">Detectado</span>
                <p className="text-[#f0f0f0] mt-0.5">
                  {new Date(finding.detectedAt).toLocaleString("es-ES", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div>
                <span className="text-[#555]">Último escaneo</span>
                <p className="text-[#f0f0f0] mt-0.5">
                  {finding.scan?.completedAt
                    ? new Date(finding.scan.completedAt).toLocaleString("es-ES", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : finding.scan?.startedAt
                    ? new Date(finding.scan.startedAt).toLocaleString("es-ES", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—"}
                </p>
              </div>
              {finding.resolvedAt && (
                <div>
                  <span className="text-[#555]">Resuelto</span>
                  <p className="text-[#f0f0f0] mt-0.5">
                    {new Date(finding.resolvedAt).toLocaleString("es-ES", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              )}
              <div>
                <span className="text-[#555]">Estado</span>
                <p className="text-[#f0f0f0] mt-0.5">{statusLabels[finding.status] || finding.status}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
