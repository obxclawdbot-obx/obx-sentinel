// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Onboarding from "@/components/Onboarding";

interface DashboardData {
  totalAssets: number;
  totalFindings: number;
  openFindings: number;
  criticalFindings: number;
  highFindings: number;
  score: number;
  plan: string;
  findingsBySeverity: { severity: string; count: number }[];
  findingsByStatus: { status: string; count: number }[];
  recentFindings: { id: string; title: string; severity: string; cvssScore: number; asset: string; detectedAt: string }[];
  sslExpirations: { domain: string; expiresAt: string; daysLeft: number }[];
}

const severityColors: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
  info: "bg-blue-500",
};

const severityTextColors: Record<string, string> = {
  critical: "text-red-500",
  high: "text-orange-500",
  medium: "text-yellow-500",
  low: "text-green-500",
  info: "text-blue-500",
};

const statusLabels: Record<string, string> = {
  open: "Abiertos",
  in_progress: "En progreso",
  resolved: "Resueltos",
  false_positive: "Falso positivo",
};

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: "A", color: "#00ff88" };
  if (score >= 80) return { grade: "B", color: "#22c55e" };
  if (score >= 70) return { grade: "C", color: "#eab308" };
  if (score >= 60) return { grade: "D", color: "#f97316" };
  return { grade: "F", color: "#ef4444" };
}

function SecurityGradeBadge({ score }: { score: number }) {
  const { grade, color } = getGrade(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="#222"
            strokeWidth="8"
          />
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            transform="rotate(-90 70 70)"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black" style={{ color }}>{grade}</span>
          <span className="text-xs text-[#888] font-mono">{score}/100</span>
        </div>
      </div>
      <p className="text-sm text-[#888] mt-2">Security Score</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const loadData = () => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.totalAssets === 0) setShowOnboarding(true);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="animate-pulse text-[#888]">Cargando dashboard...</div>
      </main>
    </div>
  );

  if (!data) return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 p-8">
        <p className="text-red-500">Error al cargar el dashboard. <a href="/login" className="underline text-[#00ff88]">Iniciar sesión</a></p>
      </main>
    </div>
  );

  if (showOnboarding) return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar plan={data.plan} />
      <main className="flex-1 p-8">
        <Onboarding onComplete={() => { setShowOnboarding(false); loadData(); }} />
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar plan={data.plan} />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-[#f0f0f0] mb-6">Dashboard de Seguridad</h1>

        {/* Top row: Grade + KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-1 bg-[#181818] border border-[#222] rounded-2xl p-6 flex items-center justify-center">
            <SecurityGradeBadge score={data.score} />
          </div>
          <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-6">
              <p className="text-sm text-[#888] mb-1">Activos monitorizados</p>
              <p className="text-3xl font-bold text-[#f0f0f0] font-mono">{data.totalAssets}</p>
            </div>
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-6">
              <p className="text-sm text-[#888] mb-1">Total hallazgos</p>
              <p className="text-3xl font-bold text-[#f0f0f0] font-mono">{data.totalFindings}</p>
            </div>
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-6">
              <p className="text-sm text-[#888] mb-1">Hallazgos abiertos</p>
              <p className="text-3xl font-bold text-orange-500 font-mono">{data.openFindings}</p>
            </div>
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-6">
              <p className="text-sm text-[#888] mb-1">Críticos</p>
              <p className="text-3xl font-bold text-red-500 font-mono">{data.criticalFindings}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Findings by Severity */}
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-[#f0f0f0] mb-4">Hallazgos por severidad</h2>
            <div className="space-y-3">
              {data.findingsBySeverity.map((item) => (
                <div key={item.severity} className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${severityColors[item.severity] || "bg-gray-600"}`} />
                  <span className="text-sm text-[#888] capitalize flex-1">{item.severity}</span>
                  <span className="text-sm font-semibold text-[#f0f0f0] font-mono">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Findings by Status */}
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-[#f0f0f0] mb-4">Estado de hallazgos</h2>
            <div className="space-y-3">
              {data.findingsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm text-[#888]">{statusLabels[item.status] || item.status}</span>
                  <span className="text-sm font-semibold text-[#f0f0f0] font-mono">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Findings */}
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-[#f0f0f0] mb-4">Últimos hallazgos</h2>
            {data.recentFindings && data.recentFindings.length > 0 ? (
              <div className="space-y-3">
                {data.recentFindings.map((f) => (
                  <div key={f.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#111] border border-[#1a1a1a]">
                    <span className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityColors[f.severity]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#f0f0f0] truncate">{f.title}</p>
                      <p className="text-xs text-[#888] mt-0.5">
                        <span className="font-mono">{f.asset}</span> · CVSS <span className="font-mono">{f.cvssScore}</span> · {new Date(f.detectedAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <span className={`text-xs font-medium capitalize ${severityTextColors[f.severity]}`}>
                      {f.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#888]">No hay hallazgos recientes.</p>
            )}
          </div>

          {/* SSL Expirations */}
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-[#f0f0f0] mb-4">Próximas expiraciones SSL</h2>
            {data.sslExpirations && data.sslExpirations.length > 0 ? (
              <div className="space-y-3">
                {data.sslExpirations.map((ssl) => (
                  <div key={ssl.domain} className="flex items-center justify-between p-3 rounded-xl bg-[#111] border border-[#1a1a1a]">
                    <div>
                      <p className="text-sm font-medium text-[#f0f0f0] font-mono">{ssl.domain}</p>
                      <p className="text-xs text-[#888]">
                        Expira: {new Date(ssl.expiresAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <span className={`text-sm font-bold font-mono ${
                      ssl.daysLeft <= 14 ? "text-red-500" : ssl.daysLeft <= 30 ? "text-yellow-500" : "text-green-500"
                    }`}>
                      {ssl.daysLeft}d
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#888]">Sin certificados próximos a expirar.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
