// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

interface DashboardData {
  totalAssets: number;
  totalFindings: number;
  openFindings: number;
  criticalFindings: number;
  highFindings: number;
  score: number;
  findingsBySeverity: { severity: string; count: number }[];
  findingsByStatus: { status: string; count: number }[];
  recentFindings: { id: string; title: string; severity: string; cvssScore: number; asset: string; detectedAt: string }[];
  sslExpirations: { domain: string; expiresAt: string; daysLeft: number }[];
}

const severityColors: Record<string, string> = {
  critical: "bg-red-600",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
  info: "bg-gray-400",
};

const severityTextColors: Record<string, string> = {
  critical: "text-red-600",
  high: "text-orange-500",
  medium: "text-yellow-600",
  low: "text-blue-500",
  info: "text-gray-500",
};

const statusLabels: Record<string, string> = {
  open: "Abiertos",
  in_progress: "En progreso",
  resolved: "Resueltos",
  false_positive: "Falso positivo",
};

function SecurityGauge({ score }: { score: number }) {
  const radius = 70;
  const stroke = 12;
  const circumference = Math.PI * radius; // half circle
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="100" viewBox="0 0 180 100">
        {/* Background arc */}
        <path
          d="M 10 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d="M 10 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
        <text x="90" y="80" textAnchor="middle" className="text-3xl font-bold" fill={color} fontSize="32">
          {score}
        </text>
        <text x="90" y="96" textAnchor="middle" fill="#6b7280" fontSize="11">
          / 100
        </text>
      </svg>
      <p className="text-sm text-gray-500 mt-1">Security Score</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="animate-pulse text-gray-500">Cargando dashboard...</div>
      </main>
    </div>
  );

  if (!data) return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <p className="text-red-500">Error al cargar el dashboard. <a href="/login" className="underline">Iniciar sesión</a></p>
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard de Seguridad</h1>

        {/* Top row: KPIs + Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border p-6 flex items-center justify-center">
            <SecurityGauge score={data.score} />
          </div>
          <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <p className="text-sm text-gray-500 mb-1">Activos monitorizados</p>
              <p className="text-3xl font-bold text-gray-900">{data.totalAssets}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <p className="text-sm text-gray-500 mb-1">Total hallazgos</p>
              <p className="text-3xl font-bold text-gray-900">{data.totalFindings}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <p className="text-sm text-gray-500 mb-1">Hallazgos abiertos</p>
              <p className="text-3xl font-bold text-orange-600">{data.openFindings}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <p className="text-sm text-gray-500 mb-1">Críticos</p>
              <p className="text-3xl font-bold text-red-600">{data.criticalFindings}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Findings by Severity */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hallazgos por severidad</h2>
            <div className="space-y-3">
              {data.findingsBySeverity.map((item) => (
                <div key={item.severity} className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${severityColors[item.severity] || "bg-gray-300"}`} />
                  <span className="text-sm text-gray-700 capitalize flex-1">{item.severity}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Findings by Status */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado de hallazgos</h2>
            <div className="space-y-3">
              {data.findingsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{statusLabels[item.status] || item.status}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Findings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Últimos hallazgos</h2>
            {data.recentFindings && data.recentFindings.length > 0 ? (
              <div className="space-y-3">
                {data.recentFindings.map((f) => (
                  <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <span className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityColors[f.severity]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{f.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {f.asset} · CVSS {f.cvssScore} · {new Date(f.detectedAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <span className={`text-xs font-medium capitalize ${severityTextColors[f.severity]}`}>
                      {f.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay hallazgos recientes.</p>
            )}
          </div>

          {/* SSL Expirations */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximas expiraciones SSL</h2>
            {data.sslExpirations && data.sslExpirations.length > 0 ? (
              <div className="space-y-3">
                {data.sslExpirations.map((ssl) => (
                  <div key={ssl.domain} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ssl.domain}</p>
                      <p className="text-xs text-gray-500">
                        Expira: {new Date(ssl.expiresAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${
                      ssl.daysLeft <= 14 ? "text-red-600" : ssl.daysLeft <= 30 ? "text-yellow-600" : "text-green-600"
                    }`}>
                      {ssl.daysLeft}d
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin certificados próximos a expirar.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
