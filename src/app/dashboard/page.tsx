// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Onboarding from "@/components/Onboarding";
import ReportButton from "@/components/ReportButton";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

interface HistoryPoint {
  date: string;
  score: number;
  findings_count: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

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
  firstAssetId: string | null;
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

const severityGlow: Record<string, string> = {
  critical: "severity-glow-critical",
  high: "severity-glow-high",
  medium: "severity-glow-medium",
  low: "",
  info: "",
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
  const glowClass = score < 60 ? "pulse-glow-red" : score < 75 ? "pulse-glow-orange" : "";

  return (
    <div className="flex flex-col items-center">
      <div className={`relative rounded-full ${glowClass}`}>
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

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-[#181818] border border-[#222] rounded-2xl p-6 ${className}`}>
      <div className="skeleton h-4 w-24 mb-3" />
      <div className="skeleton h-8 w-16" />
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-[#181818] border border-[#222] rounded-2xl p-6 ${className}`}>
      <div className="skeleton h-5 w-40 mb-4" />
      <div className="space-y-3">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [history, setHistory] = useState<HistoryPoint[]>([]);

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

  useEffect(() => {
    loadData();
    fetch("/api/dashboard/history")
      .then((r) => r.json())
      .then((h) => { if (Array.isArray(h)) setHistory(h); })
      .catch(console.error);
  }, []);

  if (loading) return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 p-8 bg-grid">
        <div className="skeleton h-7 w-56 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          <SkeletonBlock className="lg:col-span-1" />
          <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SkeletonBlock /><SkeletonBlock />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonBlock /><SkeletonBlock />
        </div>
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
      <main className="flex-1 p-8 bg-grid">
        <h1 className="text-2xl font-bold text-[#f0f0f0] mb-6 animate-in">Dashboard de Seguridad</h1>

        {/* Top row: Grade + KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8 animate-in">
          <div className="lg:col-span-1 bg-[#181818] border border-[#222] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 card-hover">
            <SecurityGradeBadge score={data.score} />
            {data.firstAssetId && data.plan !== "starter" && (
              <ReportButton assetId={data.firstAssetId} size="sm" />
            )}
          </div>
          <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-6 card-hover">
              <p className="text-sm text-[#888] mb-1">Activos monitorizados</p>
              <p className="text-3xl font-bold text-[#f0f0f0] font-mono">{data.totalAssets}</p>
            </div>
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-6 card-hover">
              <p className="text-sm text-[#888] mb-1">Total hallazgos</p>
              <p className="text-3xl font-bold text-[#f0f0f0] font-mono">{data.totalFindings}</p>
            </div>
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-6 card-hover">
              <p className="text-sm text-[#888] mb-1">Hallazgos abiertos</p>
              <p className="text-3xl font-bold text-orange-500 font-mono">{data.openFindings}</p>
            </div>
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-6 card-hover">
              <p className="text-sm text-[#888] mb-1">Críticos</p>
              <p className="text-3xl font-bold text-red-500 font-mono">{data.criticalFindings}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-in-delay-1">
          {/* Findings by Severity */}
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-6 card-hover">
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
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-6 card-hover">
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

        {/* Charts: Trend + Severity Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in-delay-2">
          {/* Security Score Trend */}
          <div className="lg:col-span-2 bg-[#181818] border border-[#222] rounded-2xl p-6 card-hover">
            <h2 className="text-lg font-semibold text-[#f0f0f0] mb-4">Evolución del Security Score</h2>
            {history.length <= 1 ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-[#333] mx-auto mb-3">
                    <path d="M1 12l3-4 3 2 4-6 4 3" />
                  </svg>
                  <p className="text-sm text-[#888]">Realiza más escaneos para ver la tendencia</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={history} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00ff88" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis
                    dataKey="date"
                    stroke="#555"
                    tick={{ fill: "#888", fontSize: 11 }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                  />
                  <YAxis domain={[0, 100]} stroke="#555" tick={{ fill: "#888", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "12px" }}
                    labelStyle={{ color: "#888" }}
                    itemStyle={{ color: "#00ff88" }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                    formatter={(value: number) => [`${value} pts`, "Score"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#00ff88"
                    strokeWidth={2}
                    fill="url(#scoreGradient)"
                    dot={{ fill: "#00ff88", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: "#00ff88", stroke: "#0a0a0a", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Severity Pie Chart */}
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-6 card-hover">
            <h2 className="text-lg font-semibold text-[#f0f0f0] mb-4">Hallazgos por severidad</h2>
            {(() => {
              const pieData = (data.findingsBySeverity || []).filter((s) => s.count > 0);
              const total = pieData.reduce((sum, s) => sum + s.count, 0);
              const COLORS: Record<string, string> = {
                critical: "#ef4444",
                high: "#f97316",
                medium: "#eab308",
                low: "#22c55e",
                info: "#3b82f6",
              };
              if (total === 0) {
                return (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-sm text-[#888]">Sin hallazgos</p>
                  </div>
                );
              }
              return (
                <div className="relative flex items-center justify-center" style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="count"
                        nameKey="severity"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[entry.severity] || "#666"} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "12px" }}
                        itemStyle={{ color: "#f0f0f0" }}
                        formatter={(value: number, name: string) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-[#f0f0f0] font-mono">{total}</span>
                      <p className="text-[10px] text-[#888]">total</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in-delay-2">
          {/* Recent Findings */}
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-6 card-hover">
            <h2 className="text-lg font-semibold text-[#f0f0f0] mb-4">Últimos hallazgos</h2>
            {data.recentFindings && data.recentFindings.length > 0 ? (
              <div className="space-y-3">
                {data.recentFindings.map((f) => (
                  <div key={f.id} className={`flex items-start gap-3 p-3 rounded-xl bg-[#111] border border-[#1a1a1a] ${severityGlow[f.severity] || ""}`}>
                    <span className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityColors[f.severity]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#f0f0f0] truncate">{f.title}</p>
                      <p className="text-xs text-[#888] mt-0.5">
                        <span className="font-mono">{f.asset}</span> · CVSS <span className="font-mono">{f.cvssScore}</span> · {new Date(f.detectedAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full border ${
                      f.severity === "critical" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                      f.severity === "high" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                      f.severity === "medium" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                      f.severity === "low" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                      "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    }`}>
                      {f.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-[#333] mx-auto mb-3">
                  <path d="M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z"/>
                </svg>
                <p className="text-sm text-[#888]">No hay hallazgos recientes.</p>
                <p className="text-xs text-[#555] mt-1">Lanza un escaneo para empezar.</p>
              </div>
            )}
          </div>

          {/* SSL Expirations */}
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-6 card-hover">
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
              <div className="text-center py-8">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-[#333] mx-auto mb-3">
                  <rect x="3" y="7" width="10" height="7" rx="2"/><path d="M5 7V5a3 3 0 016 0v2"/>
                </svg>
                <p className="text-sm text-[#888]">Sin certificados próximos a expirar.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
