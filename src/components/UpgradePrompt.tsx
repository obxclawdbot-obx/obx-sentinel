"use client";

import { useState } from "react";

interface UpgradePromptProps {
  message: string;
  currentPlan?: string;
  suggestedPlan?: "starter" | "professional" | "business";
}

export default function UpgradePrompt({ message, currentPlan, suggestedPlan = "professional" }: UpgradePromptProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: suggestedPlan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Checkout error:", data.error);
        setLoading(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#181818] border border-[#00ff88]/20 rounded-2xl p-6 flex items-center gap-4">
      <div className="text-3xl">🔒</div>
      <div className="flex-1">
        <p className="text-[#f0f0f0] font-medium">{message}</p>
        <p className="text-[#888] text-sm mt-1">
          Plan actual: <span className="capitalize">{currentPlan || "básico"}</span>
        </p>
      </div>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="px-5 py-2.5 bg-[#00ff88] text-[#0a0a0a] font-bold rounded-xl text-sm hover:bg-[#00e07a] transition-colors whitespace-nowrap disabled:opacity-50"
      >
        {loading ? "Cargando..." : "Mejorar plan ↗"}
      </button>
    </div>
  );
}
