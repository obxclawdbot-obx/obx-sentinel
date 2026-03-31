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

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">🛡️ OBX Sentinel</h1>
        <p className="text-xs text-gray-400 mt-1">Ciberseguridad para pymes</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => fetch("/api/auth/signout", { method: "POST" }).then(() => window.location.href = "/login")}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
