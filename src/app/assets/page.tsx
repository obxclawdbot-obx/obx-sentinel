"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UpgradePrompt from "@/components/UpgradePrompt";

interface Asset {
  id: string;
  type: string;
  value: string;
  status: string;
  createdAt: string;
}

const typeIcons: Record<string, string> = { domain: "🌐", ip: "📡", email: "📧" };

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState("domain");
  const [newValue, setNewValue] = useState("");
  const [planError, setPlanError] = useState("");
  const [plan, setPlan] = useState("");

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

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar plan={plan} />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#f0f0f0]">Activos monitorizados</h1>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-[#00ff88] text-[#0a0a0a] rounded-xl text-sm font-bold hover:bg-[#00e07a] transition-colors">
            + Añadir activo
          </button>
        </div>

        {planError && (
          <div className="mb-6">
            <UpgradePrompt message={planError} currentPlan={plan} />
          </div>
        )}

        {showForm && (
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-6 mb-6">
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
          <div className="animate-pulse text-[#888]">Cargando activos...</div>
        ) : assets.length === 0 ? (
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-12 text-center text-[#888]">
            No hay activos. Añade tu primer dominio, IP o email para monitorizar.
          </div>
        ) : (
          <div className="bg-[#181818] border border-[#222] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-[#222]">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#888] uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#888] uppercase tracking-wider">Valor</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#888] uppercase tracking-wider">Estado</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#888] uppercase tracking-wider">Fecha</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-[#888] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {assets.map(a => (
                  <tr key={a.id} className="hover:bg-[#1a1a1a] group transition-colors">
                    <td className="px-6 py-4 text-sm text-[#f0f0f0]">{typeIcons[a.type] || "📦"} {a.type}</td>
                    <td className="px-6 py-4 text-sm font-mono text-[#00ff88]">{a.value}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${a.status === "active" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-[#222] text-[#888] border border-[#333]"}`}>
                        {a.status === "active" ? "Activo" : a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#888]">{new Date(a.createdAt).toLocaleDateString("es-ES")}</td>
                    <td className="px-6 py-4 text-right">
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
