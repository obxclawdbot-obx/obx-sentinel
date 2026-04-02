"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

interface AlertConfig {
  id: string;
  type: string;
  channel: string;
  enabled: boolean;
}

const alertLabels: Record<string, { title: string; desc: string; icon: JSX.Element }> = {
  new_critical: {
    title: "Hallazgo crítico",
    desc: "Notificar cuando se detecte una vulnerabilidad crítica (CVSS ≥ 9.0)",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="#ef4444" strokeWidth="1.5" className="w-6 h-6">
        <path d="M8 1l7 13H1L8 1z"/><path d="M8 6v3M8 11.5v.5"/>
      </svg>
    ),
  },
  cert_expiry: {
    title: "Certificado SSL expirando",
    desc: "Avisar 30 días antes de que expire un certificado SSL",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="#eab308" strokeWidth="1.5" className="w-6 h-6">
        <rect x="3" y="7" width="10" height="7" rx="2"/><path d="M5 7V5a3 3 0 016 0v2"/>
      </svg>
    ),
  },
  new_breach: {
    title: "Credenciales filtradas",
    desc: "Alertar si se detectan emails corporativos en bases de datos filtradas",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="#f97316" strokeWidth="1.5" className="w-6 h-6">
        <path d="M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z"/><path d="M6 8l2 2 4-4"/>
      </svg>
    ),
  },
  weekly_digest: {
    title: "Resumen semanal",
    desc: "Informe semanal con el estado de todos los activos y hallazgos",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="#00ff88" strokeWidth="1.5" className="w-6 h-6">
        <rect x="2" y="1" width="12" height="14" rx="1.5"/><path d="M5 4h6M5 7h6M5 10h3"/>
      </svg>
    ),
  },
};

function SkeletonAlerts() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-[#181818] border border-[#222] rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="skeleton w-6 h-6 rounded" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-3 w-56" />
            </div>
          </div>
          <div className="skeleton w-12 h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

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
      <main className="flex-1 p-8 bg-grid">
        <h1 className="text-2xl font-bold text-[#f0f0f0] mb-6 animate-in">Configuración de alertas</h1>
        {loading ? (
          <SkeletonAlerts />
        ) : alerts.length === 0 ? (
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-12 text-center animate-in">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-[#333] mx-auto mb-3">
              <path d="M4 6a4 4 0 018 0c0 4 2 5 2 5H2s2-1 2-5zM6 13a2 2 0 004 0"/>
            </svg>
            <p className="text-[#888] mb-1">No hay alertas configuradas.</p>
            <p className="text-xs text-[#555]">Las alertas se configuran automáticamente al registrarte.</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in-delay-1">
            {alerts.map(a => {
              const info = alertLabels[a.type] || {
                title: a.type,
                desc: "",
                icon: (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                    <path d="M4 6a4 4 0 018 0c0 4 2 5 2 5H2s2-1 2-5zM6 13a2 2 0 004 0"/>
                  </svg>
                ),
              };
              return (
                <div key={a.id} className="bg-[#181818] border border-[#222] rounded-2xl p-6 flex items-center justify-between card-hover">
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5">{info.icon}</span>
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
