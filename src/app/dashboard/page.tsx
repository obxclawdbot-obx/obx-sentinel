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
}

const severityColors: Record<string, string> = {
  critical: "bg-red-600",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
  info: "bg-gray-400",
};

const statusLabels: Record<string, string> = {
  open: "Abiertos",
  in_progress: "En progreso",
  resolved: "Resueltos",
  false_positive: "Falso positivo",
};

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

  const scoreColor = data.score >= 70 ? "text-green-600" : data.score >= 40 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard de Seguridad</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm text-gray-500 mb-1">Security Score</p>
            <p className={`text-4xl font-bold ${scoreColor}`}>{data.score}/100</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm text-gray-500 mb-1">Activos monitorizados</p>
            <p className="text-4xl font-bold text-gray-900">{data.totalAssets}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm text-gray-500 mb-1">Hallazgos abiertos</p>
            <p className="text-4xl font-bold text-orange-600">{data.openFindings}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm text-gray-500 mb-1">Críticos</p>
            <p className="text-4xl font-bold text-red-600">{data.criticalFindings}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </main>
    </div>
  );
}
