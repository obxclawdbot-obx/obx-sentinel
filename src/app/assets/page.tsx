"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UpgradePrompt from "@/components/UpgradePrompt";
import ReportButton from "@/components/ReportButton";

interface Asset {
  id: string;
  type: string;
  value: string;
  status: string;
  createdAt: string;
  lastScanAt?: string | null;
  findingCount?: number;
}

const typeIcons: Record<string, JSX.Element> = {
  domain: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-[#00ff88]">
      <circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2.5 2 11 0 12M8 2c-2 2.5-2 11 0 12"/>
    </svg>
  ),
  ip: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-[#00ff88]">
      <rect x="2" y="1" width="12" height="5" rx="1"/><rect x="2" y="10" width="12" height="5" rx="1"/><circle cx="5" cy="3.5" r="0.5" fill="currentColor"/><circle cx="5" cy="12.5" r="0.5" fill="currentColor"/>
    </svg>
  ),
  email: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-[#00ff88]">
      <rect x="1" y="3" width="14" height="10" rx="1.5"/><path d="M1 4l7 5 7-5"/>
    </svg>
  ),
};

function SkeletonTable() {
  return (
    <div className="p-6 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-6">
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState("domain");
  const [newValue, setNewValue] = useState("");
  const [planError, setPlanError] = useState("");
  const [plan, setPlan] = useState("");
  const [scanning, setScanning] = useState<Record<string, boolean>>({});
  const [scanResults, setScanResults] = useState<Record<string, string>>({});

  const load = () => {
    fetch("/api/assets").then(r => r.json()).then((data) => {
      if (Array.isArray(data)) {
        setAssets(data);
      } else {
        setAssets(data.assets || []);
        if (data.plan) setPlan(data.plan);
      }
    }).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const add = async () => {
    if (!newValue.trim()) return;
    setPlanError("");
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newType, value: newValue.trim() }),
    });
    const data = await res.json();
    if (!res.ok && data.upgradeRequired) {
      setPlanError(data.error);
      return;
    }
    setNewValue("");
    setShowForm(false);
    setLoading(true);
    load();
  };

  const startScan = async (assetId: string) => {
    setScanning((s) => ({ ...s, [assetId]: true }));
    setScanResults((r) => ({ ...r, [assetId]: "" }));
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.upgradeRequired) {
          setPlanError(data.error);
        }
        setScanResults((r) => ({ ...r, [assetId]: data.error || "Error" }));
        return;
      }
      // Poll for completion
      const scanId = data.scan?.id;
      if (scanId) {
        let attempts = 0;
        const poll = async () => {
          attempts++;
          const sr = await fetch(`/api/scan?id=${scanId}`);
          const scanData = await sr.json();
          if (scanData?.status === "completed" || scanData?.status === "failed") {
            const count = scanData.findings?.length || 0;
            setScanResults((r) => ({
              ...r,
              [assetId]: scanData.status === "completed"
                ? `${count} hallazgo${count !== 1 ? "s" : ""}`
                : "Error en escaneo",
            }));
            setScanning((s) => ({ ...s, [assetId]: false }));
            load();
            return;
          }
          if (attempts < 60) {
            setTimeout(poll, 2000);
          } else {
            setScanResults((r) => ({ ...r, [assetId]: "Timeout" }));
            setScanning((s) => ({ ...s, [assetId]: false }));
          }
        };
        setTimeout(poll, 3000);
      }
    } catch {
      setScanResults((r) => ({ ...r, [assetId]: "Error de conexión" }));
      setScanning((s) => ({ ...s, [assetId]: false }));
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar plan={plan} />
      <main className="flex-1 p-8 bg-grid">
        <div className="flex items-center justify-between mb-6 animate-in">
          <h1 className="text-2xl font-bold text-[#f0f0f0]">Activos monitorizados</h1>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-[#00ff88] text-[#0a0a0a] rounded-xl text-sm font-bold hover:bg-[#00e07a] transition-colors">
            + Añadir activo
          </button>
        </div>

        {planError && (
          <div className="mb-6 animate-in">
            <UpgradePrompt message={planError} currentPlan={plan} />
          </div>
        )}

        {showForm && (
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-6 mb-6 animate-in">
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1">Tipo</label>
                <select value={newType} onChange={e => setNewType(e.target.value)} className="bg-[#111] border border-[#333] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00ff88]">
                  <option value="domain">Dominio</option>
                  <option value="ip">IP</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#888] mb-1">Valor</label>
                <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="ejemplo.com" className="w-full bg-[#111] border border-[#333] text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#00ff88]" onKeyDown={e => e.key === "Enter" && add()} />
              </div>
              <button onClick={add} className="px-4 py-2 bg-[#00ff88] text-[#0a0a0a] rounded-xl text-sm font-bold hover:bg-[#00e07a] transition-colors">Guardar</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-[#181818] border border-[#222] rounded-2xl overflow-hidden">
            <SkeletonTable />
          </div>
        ) : assets.length === 0 ? (
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-12 text-center animate-in">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-[#333] mx-auto mb-3">
              <rect x="2" y="1" width="12" height="5" rx="1"/><rect x="2" y="10" width="12" height="5" rx="1"/><circle cx="5" cy="3.5" r="0.5" fill="currentColor"/><circle cx="5" cy="12.5" r="0.5" fill="currentColor"/>
            </svg>
            <p className="text-[#888] mb-2">No hay activos.</p>
            <p className="text-xs text-[#555] mb-4">Añade tu primer dominio, IP o email para monitorizar.</p>
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-[#00ff88] text-[#0a0a0a] rounded-xl text-sm font-bold hover:bg-[#00e07a] transition-colors">
              + Añadir activo
            </button>
          </div>
        ) : (
          <div className="bg-[#181818] border border-[#222] rounded-2xl overflow-hidden card-hover animate-in-delay-1">
            <table className="w-full">
              <thead className="border-b border-[#222]">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#888] uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#888] uppercase tracking-wider">Valor</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#888] uppercase tracking-wider">Estado</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#888] uppercase tracking-wider">Último escaneo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#888] uppercase tracking-wider">Hallazgos</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-[#888] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {assets.map(a => (
                  <tr key={a.id} className="hover:bg-[#1a1a1a] group transition-colors">
                    <td className="px-6 py-4 text-sm text-[#f0f0f0]">
                      <span className="inline-flex items-center gap-2">
                        {typeIcons[a.type] || <span className="w-4 h-4" />}
                        {a.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-[#00ff88]">{a.value}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${a.status === "active" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-[#222] text-[#888] border border-[#333]"}`}>
                        {a.status === "active" ? "Activo" : a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#888]">
                      {a.lastScanAt ? new Date(a.lastScanAt).toLocaleDateString("es-ES") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {typeof a.findingCount === "number" ? (
                        <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-mono bg-[#222] text-[#ccc]">
                          {a.findingCount}
                        </span>
                      ) : (
                        <span className="text-sm text-[#555]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => startScan(a.id)}
                          disabled={scanning[a.id]}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 rounded-lg hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50"
                        >
                          {scanning[a.id] ? (
                            <>
                              <svg className="animate-spin w-3 h-3" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" />
                              </svg>
                              Escaneando…
                            </>
                          ) : (
                            "Escanear"
                          )}
                        </button>
                        {scanResults[a.id] && !scanning[a.id] && (
                          <span className="text-xs text-[#888]">{scanResults[a.id]}</span>
                        )}
                        {plan && plan !== "starter" && (
                          <ReportButton assetId={a.id} size="sm" />
                        )}
                        <button
                          onClick={async () => {
                            if (!confirm(`¿Eliminar ${a.value}? Se borrarán también sus scans y hallazgos.`)) return;
                            await fetch(`/api/assets?id=${a.id}`, { method: "DELETE" });
                            setLoading(true);
                            load();
                          }}
                          className="text-red-500 hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
