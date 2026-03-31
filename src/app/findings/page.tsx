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
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
  info: "bg-gray-100 text-gray-600 border-gray-200",
};

const statusBadge: Record<string, string> = {
  open: "bg-red-50 text-red-600",
  in_progress: "bg-yellow-50 text-yellow-600",
  resolved: "bg-green-50 text-green-600",
  false_positive: "bg-gray-50 text-gray-500",
};

const statusLabel: Record<string, string> = {
  open: "Abierto",
  in_progress: "En progreso",
  resolved: "Resuelto",
  false_positive: "Falso positivo",
};

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
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Hallazgos de seguridad</h1>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="border rounded-lg px-3 py-2 text-sm text-gray-700 bg-white">
            <option value="">Todas las severidades</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
            <option value="info">Info</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm text-gray-700 bg-white">
            <option value="">Todos los estados</option>
            <option value="open">Abierto</option>
            <option value="in_progress">En progreso</option>
            <option value="resolved">Resuelto</option>
            <option value="false_positive">Falso positivo</option>
          </select>
          <span className="text-sm text-gray-500 self-center">{findings.length} hallazgos</span>
        </div>

        {loading ? (
          <div className="animate-pulse text-gray-500">Cargando hallazgos...</div>
        ) : findings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
            No se encontraron hallazgos con los filtros seleccionados.
          </div>
        ) : (
          <div className="space-y-3">
            {findings.map(f => (
              <div key={f.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(expanded === f.id ? null : f.id)}>
                  <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${severityBadge[f.severity]}`}>
                    {f.severity.toUpperCase()} {f.cvssScore.toFixed(1)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{f.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{f.asset.value} · {f.cveId || "Sin CVE"}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${statusBadge[f.status]}`}>
                    {statusLabel[f.status]}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(f.detectedAt).toLocaleDateString("es-ES")}</span>
                  <span className="text-gray-400">{expanded === f.id ? "▲" : "▼"}</span>
                </div>
                {expanded === f.id && (
                  <div className="px-6 py-4 border-t bg-gray-50">
                    <p className="text-sm text-gray-700 mb-3">{f.description}</p>
                    {f.remediation && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 mb-1">REMEDIACIÓN</p>
                        <p className="text-sm text-gray-700">{f.remediation}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {f.status === "open" && (
                        <>
                          <button onClick={() => updateStatus(f.id, "in_progress")} className="px-3 py-1.5 text-xs bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Marcar en progreso</button>
                          <button onClick={() => updateStatus(f.id, "false_positive")} className="px-3 py-1.5 text-xs bg-gray-500 text-white rounded-lg hover:bg-gray-600">Falso positivo</button>
                        </>
                      )}
                      {f.status === "in_progress" && (
                        <button onClick={() => updateStatus(f.id, "resolved")} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">Marcar resuelto</button>
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
