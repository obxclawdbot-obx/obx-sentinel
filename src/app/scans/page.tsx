// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

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
  email_breach: "Búsqueda de brechas",
};

const statusStyles: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  running: "bg-blue-100 text-blue-700 animate-pulse",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  running: "En curso...",
  completed: "Completado",
  failed: "Fallido",
};

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [launching, setLaunching] = useState(false);
  const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());

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

  // Poll running scans
  useEffect(() => {
    const running = scans.filter((s) => s.status === "running");
    if (running.length === 0) return;

    const interval = setInterval(() => {
      fetchScans();
    }, 2000);

    return () => clearInterval(interval);
  }, [scans]);

  const launchScan = async () => {
    if (!selectedAsset) return;
    setLaunching(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: selectedAsset }),
      });
      if (res.ok) {
        await fetchScans();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Motor de Escaneo</h1>
        </div>

        {/* Launch scan */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lanzar escaneo</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Activo objetivo</label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {launching ? "Lanzando..." : "⚡ Lanzar escaneo"}
            </button>
          </div>
        </div>

        {/* Scan history */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Historial de escaneos</h2>
          </div>
          {loading ? (
            <div className="p-6 text-gray-500 animate-pulse">Cargando...</div>
          ) : scans.length === 0 ? (
            <div className="p-6 text-gray-500">No hay escaneos registrados. Lanza el primero.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Activo</th>
                  <th className="px-6 py-3 text-left">Tipo</th>
                  <th className="px-6 py-3 text-left">Estado</th>
                  <th className="px-6 py-3 text-left">Hallazgos</th>
                  <th className="px-6 py-3 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {scan.asset?.value || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {typeLabels[scan.type] || scan.type}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[scan.status] || ""}`}>
                        {statusLabels[scan.status] || scan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {scan.status === "running" ? "..." : scan._count?.findings ?? 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
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
