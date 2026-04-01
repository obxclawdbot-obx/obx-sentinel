"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

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

  const load = () => {
    fetch("/api/assets").then(r => r.json()).then(setAssets).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const add = async () => {
    if (!newValue.trim()) return;
    await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newType, value: newValue.trim() }),
    });
    setNewValue("");
    setShowForm(false);
    setLoading(true);
    load();
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Activos monitorizados</h1>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            + Añadir activo
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={newType} onChange={e => setNewType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm text-gray-900">
                  <option value="domain">Dominio</option>
                  <option value="ip">IP</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="ejemplo.com" className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900" onKeyDown={e => e.key === "Enter" && add()} />
              </div>
              <button onClick={add} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Guardar</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="animate-pulse text-gray-500">Cargando activos...</div>
        ) : assets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
            No hay activos. Añade tu primer dominio, IP o email para monitorizar.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assets.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4 text-sm">{typeIcons[a.type] || "📦"} {a.type}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{a.value}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${a.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {a.status === "active" ? "Activo" : a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(a.createdAt).toLocaleDateString("es-ES")}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={async () => {
                          if (!confirm(`¿Eliminar ${a.value}? Se borrarán también sus scans y hallazgos.`)) return;
                          await fetch(`/api/assets?id=${a.id}`, { method: "DELETE" });
                          setLoading(true);
                          load();
                        }}
                        className="text-red-500 hover:text-red-700 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
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
