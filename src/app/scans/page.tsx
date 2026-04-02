// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UpgradePrompt from "@/components/UpgradePrompt";
import ReportButton from "@/components/ReportButton";

interface Asset {
  id: string;
  type: string;
  value: string;
}

interface Scan {
  id: string;
  type: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  asset: Asset;
  _count?: { findings: number };
}

interface ComparisonFinding {
  id: string;
  title: string;
  severity: string;
  cvssScore: number;
  description: string;
}

interface ComparisonResult {
  new: ComparisonFinding[];
  resolved: ComparisonFinding[];
  persistent: ComparisonFinding[];
  score1: number;
  score2: number;
  scoreDelta: number;
}

const typeLabels: Record<string, string> = {
  port_scan: "Escaneo de puertos",
  ssl_check: "Verificación SSL",
  dns_check: "Análisis DNS",
  header_check: "Análisis headers",
  full_scan: "Escaneo completo",
  email_breach: "Búsqueda de brechas",
};

const severityColors: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
  info: "bg-blue-500",
};

const statusStyles: Record<string, string> = {
  pending: "bg-[#222] text-[#888] border border-[#333]",
  running: "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 animate-pulse",
  completed: "bg-green-500/10 text-green-500 border border-green-500/20",
  failed: "bg-red-500/10 text-red-500 border border-red-500/20",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  running: "En curso...",
  completed: "Completado",
  failed: "Fallido",
};

function SkeletonTable() {
  return (
    <div className="p-6 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-6">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-4 w-12" />
          <div className="skeleton h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [launching, setLaunching] = useState(false);
  const [planError, setPlanError] = useState("");
  const [plan, setPlan] = useState("");
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [compareScan1, setCompareScan1] = useState("");
  const [compareScan2, setCompareScan2] = useState("");

  const fetchScans = () =>
    fetch("/api/scan").then((r) => r.json()).then(setScans).catch(console.error);

  useEffect(() => {
    Promise.all([
      fetch("/api/scan").then((r) => r.json()),
      fetch("/api/assets").then((r) => r.json()),
    ])
      .then(([s, a]) => {
        setScans(s);
        setAssets(Array.isArray(a) ? a : a.assets || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const running = scans.filter((s) => s.status === "running");
    if (running.length === 0) return;
    const interval = setInterval(() => { fetchScans(); }, 2000);
    return () => clearInterval(interval);
  }, [scans]);

  const launchScan = async () => {
    if (!selectedAsset) return;
    setLaunching(true);
    setPlanError("");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: selectedAsset }),
      });
      const data = await res.json();
      if (!res.ok && data.upgradeRequired) {
        setPlanError(data.error);
      } else if (res.ok || res.status === 202) {
        await fetchScans();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLaunching(false);
    }
  };

  const runComparison = async () => {
    if (!compareScan1 || !compareScan2) return;
    setComparing(true);
    try {
      const res = await fetch(`/api/scans/compare?scan1=${compareScan1}&scan2=${compareScan2}`);
      const data = await res.json();
      if (res.ok) setComparison(data);
    } catch (e) {
      console.error(e);
    } finally {
      setComparing(false);
    }
  };

  // Group scans by asset for comparison
  const completedScans = scans.filter((s) => s.status === "completed");
  const scansByAsset: Record<string, Scan[]> = {};
  completedScans.forEach((s) => {
    const key = s.asset?.id || "unknown";
    if (!scansByAsset[key]) scansByAsset[key] = [];
    scansByAsset[key].push(s);
  });
  const canCompare = completedScans.length >= 2;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar plan={plan} />
      <main className="flex-1 p-8 bg-grid">
        <div className="flex items-center justify-between mb-6 animate-in">
          <h1 className="text-2xl font-bold text-[#f0f0f0]">Motor de Escaneo</h1>
        </div>

        {planError && (
          <div className="mb-6 animate-in">
            <UpgradePrompt message={planError} currentPlan={plan} />
          </div>
        )}

        {/* Launch scan */}
        <div className="bg-[#181818] border border-[#222] rounded-2xl p-6 mb-6 card-hover animate-in">
          <h2 className="text-lg font-semibold text-[#f0f0f0] mb-4">Lanzar escaneo</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#888] mb-1">Activo objetivo</label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full bg-[#111] border border-[#333] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00ff88]"
              >
                <option value="">Seleccionar activo...</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.value} ({a.type})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={launchScan}
              disabled={!selectedAsset || launching}
              className="flex items-center gap-2 px-6 py-2 bg-[#00ff88] text-[#0a0a0a] rounded-xl text-sm font-bold hover:bg-[#00e07a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                <path d="M9 1L3 9h5l-1 6 6-8H8l1-6z"/>
              </svg>
              {launching ? "Lanzando..." : "Lanzar escaneo"}
            </button>
          </div>
        </div>

        {/* Scan Comparison */}
        {canCompare && (
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-6 mb-6 card-hover animate-in">
            <h2 className="text-lg font-semibold text-[#f0f0f0] mb-4">Comparar escaneos</h2>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-[#888] mb-1">Scan anterior</label>
                <select
                  value={compareScan1}
                  onChange={(e) => { setCompareScan1(e.target.value); setComparison(null); }}
                  className="w-full bg-[#111] border border-[#333] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00ff88]"
                >
                  <option value="">Seleccionar...</option>
                  {completedScans.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.asset?.value} — {typeLabels[s.type] || s.type} — {new Date(s.startedAt).toLocaleString("es-ES")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-[#888] mb-1">Scan actual</label>
                <select
                  value={compareScan2}
                  onChange={(e) => { setCompareScan2(e.target.value); setComparison(null); }}
                  className="w-full bg-[#111] border border-[#333] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00ff88]"
                >
                  <option value="">Seleccionar...</option>
                  {completedScans.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.asset?.value} — {typeLabels[s.type] || s.type} — {new Date(s.startedAt).toLocaleString("es-ES")}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={runComparison}
                disabled={!compareScan1 || !compareScan2 || compareScan1 === compareScan2 || comparing}
                className="flex items-center gap-2 px-6 py-2 bg-[#00ff88] text-[#0a0a0a] rounded-xl text-sm font-bold hover:bg-[#00e07a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {comparing ? "Comparando..." : "Comparar"}
              </button>
            </div>

            {/* Comparison Results */}
            {comparison && (
              <div className="mt-6 space-y-4">
                {/* Score Delta */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#111] border border-[#1a1a1a]">
                  <div className="text-center flex-1">
                    <p className="text-xs text-[#888] mb-1">Score anterior</p>
                    <p className="text-2xl font-bold text-[#f0f0f0] font-mono">{comparison.score1}</p>
                  </div>
                  <div className="text-center">
                    <span className={`text-lg font-bold font-mono ${
                      comparison.scoreDelta > 0 ? "text-[#00ff88]" : comparison.scoreDelta < 0 ? "text-red-500" : "text-[#888]"
                    }`}>
                      {comparison.scoreDelta > 0 ? "↑" : comparison.scoreDelta < 0 ? "↓" : "="}{" "}
                      {comparison.scoreDelta > 0 ? "+" : ""}{comparison.scoreDelta} pts
                    </span>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-xs text-[#888] mb-1">Score actual</p>
                    <p className="text-2xl font-bold text-[#f0f0f0] font-mono">{comparison.score2}</p>
                  </div>
                </div>

                {/* Finding changes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* New findings */}
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-xs font-bold">{comparison.new.length}</span>
                      <h3 className="text-sm font-semibold text-[#f0f0f0]">Nuevos hallazgos</h3>
                    </div>
                    {comparison.new.length === 0 ? (
                      <p className="text-xs text-[#888]">Sin nuevos hallazgos</p>
                    ) : (
                      <div className="space-y-2">
                        {comparison.new.map((f) => (
                          <div key={f.id} className="text-xs">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${severityColors[f.severity] || "bg-gray-500"}`} />
                            <span className="text-[#f0f0f0]">{f.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resolved findings */}
                  <div className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-full bg-[#00ff88]/20 text-[#00ff88] text-xs font-bold">{comparison.resolved.length}</span>
                      <h3 className="text-sm font-semibold text-[#f0f0f0]">Resueltos</h3>
                    </div>
                    {comparison.resolved.length === 0 ? (
                      <p className="text-xs text-[#888]">Sin hallazgos resueltos</p>
                    ) : (
                      <div className="space-y-2">
                        {comparison.resolved.map((f) => (
                          <div key={f.id} className="text-xs">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${severityColors[f.severity] || "bg-gray-500"}`} />
                            <span className="text-[#f0f0f0] line-through opacity-60">{f.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Persistent findings */}
                  <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-bold">{comparison.persistent.length}</span>
                      <h3 className="text-sm font-semibold text-[#f0f0f0]">Persistentes</h3>
                    </div>
                    {comparison.persistent.length === 0 ? (
                      <p className="text-xs text-[#888]">Sin hallazgos persistentes</p>
                    ) : (
                      <div className="space-y-2">
                        {comparison.persistent.map((f) => (
                          <div key={f.id} className="text-xs">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${severityColors[f.severity] || "bg-gray-500"}`} />
                            <span className="text-[#f0f0f0]">{f.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scan history */}
        <div className="bg-[#181818] border border-[#222] rounded-2xl overflow-hidden card-hover animate-in-delay-1">
          <div className="p-6 border-b border-[#222]">
            <h2 className="text-lg font-semibold text-[#f0f0f0]">Historial de escaneos</h2>
          </div>
          {loading ? (
            <SkeletonTable />
          ) : scans.length === 0 ? (
            <div className="p-12 text-center">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-[#333] mx-auto mb-3">
                <path d="M9 1L3 9h5l-1 6 6-8H8l1-6z"/>
              </svg>
              <p className="text-[#888] mb-2">No hay escaneos registrados.</p>
              <p className="text-xs text-[#555]">Selecciona un activo y lanza el primer escaneo.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="text-xs text-[#888] uppercase tracking-wider border-b border-[#222]">
                <tr>
                  <th className="px-6 py-3 text-left">Activo</th>
                  <th className="px-6 py-3 text-left">Tipo</th>
                  <th className="px-6 py-3 text-left">Estado</th>
                  <th className="px-6 py-3 text-left">Hallazgos</th>
                  <th className="px-6 py-3 text-left">Fecha</th>
                  <th className="px-6 py-3 text-right">Informe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-6 py-4 text-sm text-[#f0f0f0] font-mono">
                      {scan.asset?.value || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#888]">
                      {typeLabels[scan.type] || scan.type}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[scan.status] || ""}`}>
                        {statusLabels[scan.status] || scan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#888] font-mono">
                      {scan.status === "running" ? "..." : scan._count?.findings ?? 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#888]">
                      {new Date(scan.startedAt).toLocaleString("es-ES")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {scan.status === "completed" && (
                        <ReportButton scanId={scan.id} size="sm" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
