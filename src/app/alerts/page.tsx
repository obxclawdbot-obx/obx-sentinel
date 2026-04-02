// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

interface AlertConfig {
  id: string;
  type: string;
  channel: string;
  enabled: boolean;
}

interface AlertHistoryItem {
  id: string;
  type: string;
  severity: string;
  findingsCount: number;
  message: string;
  sent: boolean;
  createdAt: string;
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

const severityOptions = [
  { value: "critical", label: "Crítico" },
  { value: "high", label: "Alto" },
  { value: "medium", label: "Medio" },
  { value: "low", label: "Bajo" },
  { value: "info", label: "Informativo" },
];

const severityColors: Record<string, string> = {
  critical: "text-red-500",
  high: "text-orange-500",
  medium: "text-yellow-500",
  low: "text-green-500",
  info: "text-blue-500",
};

const severityBadge: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  low: "bg-green-500/10 text-green-500 border-green-500/20",
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
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
  const [history, setHistory] = useState<AlertHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Email config form state
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailAddress, setEmailAddress] = useState("");
  const [minSeverity, setMinSeverity] = useState("medium");

  useEffect(() => {
    fetch("/api/alerts/configure")
      .then((r) => r.json())
      .then((data) => {
        setAlerts(data.configs || []);
        setHistory(data.history || []);
        setEmailEnabled(data.emailEnabled ?? true);
        setEmailAddress(data.emailAddress || "");
        setMinSeverity(data.minSeverity || "medium");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id: string, enabled: boolean) => {
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)));
  };

  const saveConfig = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/alerts/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailEnabled, emailAddress, minSeverity }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const hasNoConfig = alerts.length === 0 && !loading;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 p-8 bg-grid">
        <h1 className="text-2xl font-bold text-[#f0f0f0] mb-6 animate-in">Configuración de alertas</h1>

        {loading ? (
          <SkeletonAlerts />
        ) : (
          <>
            {/* Email Configuration Card */}
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-6 mb-6 animate-in">
              <div className="flex items-center gap-3 mb-4">
                <svg viewBox="0 0 16 16" fill="none" stroke="#00ff88" strokeWidth="1.5" className="w-6 h-6">
                  <rect x="1" y="3" width="14" height="10" rx="1.5" /><path d="M1 4l7 5 7-5" />
                </svg>
                <h2 className="text-lg font-semibold text-[#f0f0f0]">Alertas por email</h2>
              </div>

              {hasNoConfig && (
                <div className="bg-[#111] border border-[#00ff88]/20 rounded-xl p-4 mb-4">
                  <p className="text-sm text-[#00ff88]">⚡ Configura tus alertas para recibir notificaciones cuando se detecten vulnerabilidades.</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#f0f0f0]">Activar alertas por email</p>
                    <p className="text-xs text-[#888] mt-0.5">Recibe notificaciones cuando se completen escaneos</p>
                  </div>
                  <button
                    onClick={() => setEmailEnabled(!emailEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${emailEnabled ? "bg-[#00ff88]" : "bg-[#333]"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-transform ${emailEnabled ? "bg-[#0a0a0a] left-6" : "bg-[#888] left-0.5"}`} />
                  </button>
                </div>

                {/* Email input */}
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-1">Dirección de email</label>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="tu@empresa.com"
                    className="w-full bg-[#111] border border-[#333] text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#00ff88]"
                  />
                </div>

                {/* Minimum severity */}
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-1">Severidad mínima para alertar</label>
                  <select
                    value={minSeverity}
                    onChange={(e) => setMinSeverity(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00ff88]"
                  >
                    {severityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-[#555] mt-1">Solo recibirás alertas para hallazgos de esta severidad o superior</p>
                </div>

                {/* Save button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={saveConfig}
                    disabled={saving}
                    className="px-4 py-2 bg-[#00ff88] text-[#0a0a0a] rounded-xl text-sm font-bold hover:bg-[#00e07a] disabled:opacity-40 transition-colors"
                  >
                    {saving ? "Guardando..." : "Guardar configuración"}
                  </button>
                  {saved && <span className="text-xs text-[#00ff88]">✓ Guardado correctamente</span>}
                </div>
              </div>
            </div>

            {/* Individual Alert Types */}
            {alerts.length > 0 && (
              <div className="space-y-4 mb-6 animate-in-delay-1">
                <h2 className="text-lg font-semibold text-[#f0f0f0]">Tipos de alerta</h2>
                {alerts.map((a) => {
                  const info = alertLabels[a.type] || {
                    title: a.type,
                    desc: "",
                    icon: (
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                        <path d="M4 6a4 4 0 018 0c0 4 2 5 2 5H2s2-1 2-5zM6 13a2 2 0 004 0" />
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

            {/* Alert History */}
            <div className="bg-[#181818] border border-[#222] rounded-2xl overflow-hidden animate-in-delay-2">
              <div className="p-6 border-b border-[#222]">
                <h2 className="text-lg font-semibold text-[#f0f0f0]">Historial de alertas</h2>
              </div>
              {history.length === 0 ? (
                <div className="p-12 text-center">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-[#333] mx-auto mb-3">
                    <path d="M4 6a4 4 0 018 0c0 4 2 5 2 5H2s2-1 2-5zM6 13a2 2 0 004 0" />
                  </svg>
                  <p className="text-[#888] mb-2">No hay alertas registradas.</p>
                  <p className="text-xs text-[#555]">Las alertas se generarán automáticamente cuando se completen escaneos.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1a1a1a]">
                  {history.map((h) => (
                    <div key={h.id} className="px-6 py-4 flex items-center gap-4 hover:bg-[#1a1a1a] transition-colors">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${severityBadge[h.severity] || "bg-[#222] text-[#888] border-[#333]"}`}>
                        {h.severity}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#f0f0f0] truncate">{h.message}</p>
                        <p className="text-xs text-[#555] mt-0.5">{h.findingsCount} hallazgos · {new Date(h.createdAt).toLocaleString("es-ES")}</p>
                      </div>
                      <span className={`text-xs ${h.sent ? "text-[#00ff88]" : "text-[#555]"}`}>
                        {h.sent ? "Enviado" : "Pendiente"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
