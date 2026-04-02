"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    features: [
      "3 activos monitorizados",
      "Scanners básicos (puertos, SSL, headers)",
      "1 escaneo/día",
      "Historial 30 días",
    ],
    cta: "Empezar con Starter",
  },
  {
    id: "professional",
    name: "Professional",
    price: 149,
    popular: true,
    features: [
      "15 activos monitorizados",
      "Todos los scanners",
      "10 escaneos/día",
      "Historial 90 días",
      "Informes PDF",
    ],
    cta: "Empezar con Professional",
  },
  {
    id: "business",
    name: "Business",
    price: 299,
    features: [
      "Activos ilimitados",
      "Todos los scanners",
      "Escaneos ilimitados",
      "Historial 365 días",
      "Informes PDF con logo",
      "Acceso API",
    ],
    cta: "Empezar con Business",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("starter");

  useEffect(() => {
    // Get current plan from the page context (could be enhanced with API call)
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("current");
    if (plan) setCurrentPlan(plan);
  }, []);

  async function handleCheckout(planId: string) {
    if (planId === currentPlan) return;
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Error al crear la sesión de pago");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Error al abrir el portal");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[#f0f0f0] mb-3">
            Planes y precios
          </h1>
          <p className="text-[#888] text-lg">
            Elige el plan que mejor se adapte a tu organización
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <div
                key={plan.id}
                className={`relative bg-[#181818] rounded-2xl p-6 border transition-all ${
                  plan.popular
                    ? "border-[#00ff88] shadow-[0_0_30px_rgba(0,255,136,0.1)]"
                    : "border-[#222] hover:border-[#333]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00ff88] text-[#0a0a0a] text-xs font-bold px-3 py-1 rounded-full">
                    MÁS POPULAR
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-4 bg-[#333] text-[#f0f0f0] text-xs font-bold px-3 py-1 rounded-full">
                    PLAN ACTUAL
                  </div>
                )}

                <h3 className="text-xl font-bold text-[#f0f0f0] mb-1">
                  {plan.name}
                </h3>

                <div className="mb-5">
                  <span className="text-4xl font-bold text-[#f0f0f0]">
                    {plan.price}€
                  </span>
                  <span className="text-[#888] text-sm">/mes</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-[#ccc]">
                      <span className="text-[#00ff88] mt-0.5">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={isCurrent || loading === plan.id}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                    isCurrent
                      ? "bg-[#222] text-[#555] cursor-default"
                      : plan.popular
                      ? "bg-[#00ff88] text-[#0a0a0a] hover:bg-[#00e07a]"
                      : "bg-[#222] text-[#f0f0f0] hover:bg-[#333]"
                  } disabled:opacity-50`}
                >
                  {loading === plan.id
                    ? "Cargando..."
                    : isCurrent
                    ? "Plan actual"
                    : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={handlePortal}
            disabled={loading === "portal"}
            className="text-[#888] hover:text-[#f0f0f0] text-sm underline transition-colors disabled:opacity-50"
          >
            {loading === "portal" ? "Abriendo..." : "Gestionar suscripción →"}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="ml-6 text-[#888] hover:text-[#f0f0f0] text-sm underline transition-colors"
          >
            ← Volver al dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
