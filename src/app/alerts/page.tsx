"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

interface AlertConfig {
  id: string;
  type: string;
  channel: string;
  enabled: boolean;
}

const alertLabels: Record<string, { title: string; desc: string; icon: string }> = {
  new_critical: { title: "Hallazgo crítico", desc: "Notificar cuando se detecte una vulnerabilidad crítica (CVSS ≥ 9.0)", icon: "🔴" },
  cert_expiry: { title: "Certificado SSL expirando", desc: "Avisar 30 días antes de que expire un certificado SSL", icon: "🔐" },
  new_breach: { title: "Credenciales filtradas", desc: "Alertar si se detectan emails corporativos en bases de datos filtradas", icon: "💀" },
  weekly_digest: { title: "Resumen semanal", desc: "Informe semanal con el estado de todos los activos y hallazgos", icon: "📋" },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alerts").then(r => r.json()).then(setAlerts).catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggle = async (id: string, enabled: boolean) => {
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled } : a));
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-[#f0f0f0] mb-6">Configuración de alertas</h1>
        {loading ? (
          <div className="animate-pulse text-[#888]">Cargando alertas...</div>
        ) : (
          <div className="space-y-4">
            {alerts.map(a => {
              const info = alertLabels[a.type] || { title: a.type, desc: "", icon: "🔔" };
              return (
                <div key={a.id} className="bg-[#181818] border border-[#222] rounded-2xl p-6 flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <h3 className="font-medium text-[#f0f0f0]">{info.title}</h3>
                      <p className="text-sm text-[#888] mt-1">{info.desc}</p>
                      <p className="text-xs text-[#555] mt-2">Canal: {a.channel}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(a.id, !a.enabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${a.enabled ? "bg-[#00ff88]" : "bg-[#333]"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-transform ${a.enabled ? "bg-[#0a0a0a] left-6" : "bg-[#888] left-0.5"}`} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
