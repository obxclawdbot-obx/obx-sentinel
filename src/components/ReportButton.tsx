"use client";
import { useState } from "react";

interface ReportButtonProps {
  assetId?: string;
  scanId?: string;
  size?: "sm" | "md";
}

export default function ReportButton({ assetId, scanId, size = "md" }: ReportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const download = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (scanId) params.set("scanId", scanId);
      else if (assetId) params.set("assetId", assetId);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al generar el informe");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "informe.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const isSmall = size === "sm";

  return (
    <div className="inline-flex flex-col items-start">
      <button
        onClick={download}
        disabled={loading}
        className={`inline-flex items-center gap-2 border border-[#333] text-[#f0f0f0] rounded-xl font-medium hover:border-[#00ff88] hover:text-[#00ff88] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          isSmall ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
        }`}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"}>
          <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" />
          <path d="M8 2v8M5 7l3 3 3-3" />
        </svg>
        {loading ? "Generando..." : "PDF"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
