"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

interface Finding {
  id: string;
  title: string;
  description: string;
  severity: string;
  cvssScore: number;
  status: string;
  cveId: string | null;
  remediation: string | null;
  detectedAt: string;
  asset: { type: string; value: string };
}

const severityBadge: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  low: "bg-green-500/10 text-green-500 border-green-500/20",
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const severityGlowClass: Record<string, string> = {
  critical: "hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]",
  high: "hover:shadow-[0_0_15px_rgba(249,115,22,0.1)]",
  medium: "",
  low: "",
  info: "",
};

const statusBadge: Record<string, string> = {
  open: "bg-red-500/10 text-red-500",
  in_progress: "bg-yellow-500/10 text-yellow-500",
  resolved: "bg-green-500/10 text-green-500",
  false_positive: "bg-[#222] text-[#888]",
};

const statusLabel: Record<string, string> = {
  open: "Abierto",
  in_progress: "En progreso",
  resolved: "Resuelto",
  false_positive: "Falso positivo",
};

function SkeletonFindings() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-[#181818] border border-[#222] rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="skeleton h-6 w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FindingsPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    const params = new URLSearchParams();
    if (filterSeverity) params.set("severity", filterSeverity);
    if (filterStatus) params.set("status", filterStatus);
    fetch(`/api/findings?${params}`).then(r => r.json()).then(setFindings).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, [filterSeverity, filterStatus]);

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/findings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 p-8 bg-grid">
        <h1 className="text-2xl font-bold text-[#f0f0f0] mb-6 animate-in">Hallazgos de seguridad</h1>

        {/* Filters */}
        <div className="flex gap-4 mb-6 animate-in">
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="bg-[#111] border border-[#333] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00ff88]">
            <option value="">Todas las severidades</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
            <option value="info">Info</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[#111] border border-[#333] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00ff88]">
            <option value="">Todos los estados</option>
            <option value="open">Abierto</option>
            <option value="in_progress">En progreso</option>
            <option value="resolved">Resuelto</option>
            <option value="false_positive">Falso positivo</option>
          </select>
          <span className="text-sm text-[#888] self-center font-mono">{findings.length} hallazgos</span>
        </div>

        {loading ? (
          <SkeletonFindings />
        ) : findings.length === 0 ? (
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-12 text-center animate-in">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-[#333] mx-auto mb-3">
              <circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l4 4"/>
            </svg>
            <p className="text-[#888] mb-1">No se encontraron hallazgos.</p>
            <p className="text-xs text-[#555]">Ajusta los filtros o lanza un nuevo escaneo.</p>
          </div>
        ) : (
          <div className="space-y-3 animate-in-delay-1">
            {findings.map(f => (
              <div key={f.id} className={`bg-[#181818] border border-[#222] rounded-2xl overflow-hidden card-hover ${severityGlowClass[f.severity] || ""}`}>
                <div className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-[#1a1a1a] transition-colors" onClick={() => setExpanded(expanded === f.id ? null : f.id)}>
                  <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${severityBadge[f.severity]}`}>
                    {f.severity.toUpperCase()} <span className="font-mono ml-1">{f.cvssScore.toFixed(1)}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#f0f0f0] truncate">{f.title}</p>
                    <p className="text-xs text-[#888] mt-0.5"><span className="font-mono">{f.asset.value}</span> · {f.cveId || "Sin CVE"}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${statusBadge[f.status]}`}>
                    {statusLabel[f.status]}
                  </span>
                  <span className="text-xs text-[#555]">{new Date(f.detectedAt).toLocaleDateString("es-ES")}</span>
                  <span className="text-[#555] transition-transform" style={{ transform: expanded === f.id ? "rotate(180deg)" : "none" }}>▼</span>
                </div>
                {expanded === f.id && (
                  <div className="px-6 py-4 border-t border-[#222] bg-[#111]">
                    <p className="text-sm text-[#888] mb-3">{f.description}</p>
                    {f.remediation && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-[#555] mb-1 uppercase tracking-wider">Remediación</p>
                        <p className="text-sm text-[#888]">{f.remediation}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {f.status === "open" && (
                        <>
                          <button onClick={() => updateStatus(f.id, "in_progress")} className="px-3 py-1.5 text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition-colors">Marcar en progreso</button>
                          <button onClick={() => updateStatus(f.id, "false_positive")} className="px-3 py-1.5 text-xs bg-[#222] text-[#888] border border-[#333] rounded-lg hover:bg-[#2a2a2a] transition-colors">Falso positivo</button>
                        </>
                      )}
                      {f.status === "in_progress" && (
                        <button onClick={() => updateStatus(f.id, "resolved")} className="px-3 py-1.5 text-xs bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors">Marcar resuelto</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
