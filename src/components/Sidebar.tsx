"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/assets", label: "Activos", icon: "🖥️" },
  { href: "/findings", label: "Hallazgos", icon: "🔍" },
  { href: "/scans", label: "Escaneos", icon: "⚡" },
  { href: "/alerts", label: "Alertas", icon: "🔔" },
  { href: "/settings", label: "Configuración", icon: "⚙️" },
];

interface SidebarProps {
  plan?: string;
}

const planLabels: Record<string, string> = {
  basico: "Básico",
  profesional: "Profesional",
  enterprise: "Enterprise",
};

const planColors: Record<string, string> = {
  basico: "text-[#888] border-[#333]",
  profesional: "text-[#00ff88] border-[#00ff88]",
  enterprise: "text-[#f0f0f0] border-[#f0f0f0] bg-[#1a1a1a]",
};

export default function Sidebar({ plan }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-[#1a1a1a]">
        <h1 className="text-xl font-bold text-[#f0f0f0]">🛡️ OBX Sentinel</h1>
        <p className="text-xs text-[#555] mt-1">Ciberseguridad para pymes</p>
        {plan && (
          <span className={`inline-flex mt-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border ${planColors[plan] || planColors.basico}`}>
            {planLabels[plan] || plan}
          </span>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20"
                : "text-[#888] hover:bg-[#111] hover:text-[#f0f0f0] border border-transparent"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-[#1a1a1a]">
        <button
          onClick={() => fetch("/api/auth/signout", { method: "POST" }).then(() => window.location.href = "/login")}
          className="text-sm text-[#555] hover:text-[#f0f0f0] transition-colors"
        >
          ↩ Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
