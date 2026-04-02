// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UpgradePrompt from "@/components/UpgradePrompt";

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

const typeLabels: Record<string, string> = {
  port_scan: "Escaneo de puertos",
  ssl_check: "Verificación SSL",
  dns_check: "Análisis DNS",
  header_check: "Análisis headers",
  full_scan: "Escaneo completo",
  email_breach: "Búsqueda de brechas",
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
