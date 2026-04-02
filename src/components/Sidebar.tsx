"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
      </svg>
    ),
  },
  {
    href: "/assets",
    label: "Activos",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <rect x="2" y="1" width="12" height="5" rx="1"/><rect x="2" y="10" width="12" height="5" rx="1"/><circle cx="5" cy="3.5" r="0.5" fill="currentColor"/><circle cx="5" cy="12.5" r="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    href: "/findings",
    label: "Hallazgos",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l4 4"/>
      </svg>
    ),
  },
  {
    href: "/scans",
    label: "Escaneos",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path d="M9 1L3 9h5l-1 6 6-8H8l1-6z"/>
      </svg>
    ),
  },
  {
    href: "/alerts",
    label: "Alertas",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path d="M4 6a4 4 0 018 0c0 4 2 5 2 5H2s2-1 2-5zM6 13a2 2 0 004 0"/>
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Configuración",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M13 3l-1.5 1.5M4.5 11.5L3 13"/>
      </svg>
    ),
  },
];

interface SidebarProps {
  plan?: string;
}

const planLabels: Record<string, string> = {
  basico: "Básico",
  starter: "Starter",
  profesional: "Professional",
  enterprise: "Business",
};

const planColors: Record<string, string> = {
  basico: "text-[#888] border-[#333]",
  starter: "text-[#888] border-[#333]",
  profesional: "text-[#00ff88] border-[#00ff88]",
  enterprise: "text-[#f0f0f0] border-[#f0f0f0] bg-[#1a1a1a]",
};

export default function Sidebar({ plan }: SidebarProps) {
  const pathname = usePathname();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => { if (data?.email) setEmail(data.email); })
      .catch(() => {});
  }, []);

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <Image src="/obx-logo.png" alt="OBX" width={24} height={24} className="rounded-sm" />
          <h1 className="text-lg font-bold text-[#f0f0f0]">OBX <span className="text-[#00ff88]">Sentinel</span></h1>
        </div>
        <p className="text-xs text-[#555] mt-1">Ciberseguridad para pymes</p>
        {plan && (
          <span className={`inline-flex mt-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border ${planColors[plan] || planColors.starter}`}>
            {planLabels[plan] || plan}
          </span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item, idx) => {
          const isActive = pathname === item.href;
          return (
            <div key={item.href}>
              {idx === 4 && (
                <div className="my-3 mx-3 h-px bg-gradient-to-r from-transparent via-[#222] to-transparent" />
              )}
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative ${
                  isActive
                    ? "text-[#00ff88] bg-transparent"
                    : "text-[#888] hover:bg-[#111] hover:text-[#f0f0f0] hover:translate-x-0.5"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#00ff88] rounded-r-full" />
                )}
                <span className="shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1a1a1a]">
        {email && (
          <p className="text-xs text-[#555] mb-2 truncate">{email}</p>
        )}
        <button
          onClick={() => fetch("/api/auth/signout", { method: "POST" }).then(() => window.location.href = "/login")}
          className="text-sm text-[#555] hover:text-[#f0f0f0] transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
