"use client";

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
  },
];

export default function PricingPage() {
  const router = useRouter();

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
          {PLANS.map((plan) => (
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

              <a
                href="#contacto"
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.popular
                    ? "bg-[#00ff88] text-[#0a0a0a] hover:bg-[#00e07a]"
                    : "bg-[#222] text-[#f0f0f0] hover:bg-[#333]"
                }`}
              >
                Contactar
              </a>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <section id="contacto" className="mt-16 mb-10 scroll-mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#f0f0f0] mb-3">Contactar</h2>
            <p className="text-[#888]">
              Cuéntanos qué necesitas y te preparamos un presupuesto personalizado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Form */}
            <form
              action="https://formsubmit.co/obxaistudio@obxaistudio.com"
              method="POST"
              className="space-y-4"
            >
              <input type="hidden" name="_subject" value="Contacto desde OBX Sentinel — Pricing" />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_next" value="https://sentinel.obxaistudio.com/pricing?gracias=1" />

              <input
                name="nombre"
                placeholder="Tu nombre"
                required
                className="w-full px-4 py-3 bg-[#111] border border-[#333] text-white rounded-xl placeholder-[#555] focus:outline-none focus:border-[#00ff88] transition-colors"
              />
              <input
                name="empresa"
                placeholder="Nombre de tu empresa"
                required
                className="w-full px-4 py-3 bg-[#111] border border-[#333] text-white rounded-xl placeholder-[#555] focus:outline-none focus:border-[#00ff88] transition-colors"
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                required
                className="w-full px-4 py-3 bg-[#111] border border-[#333] text-white rounded-xl placeholder-[#555] focus:outline-none focus:border-[#00ff88] transition-colors"
              />
              <input
                name="telefono"
                placeholder="Teléfono"
                className="w-full px-4 py-3 bg-[#111] border border-[#333] text-white rounded-xl placeholder-[#555] focus:outline-none focus:border-[#00ff88] transition-colors"
              />
              <textarea
                name="mensaje"
                placeholder="¿Qué necesitas?"
                rows={3}
                className="w-full px-4 py-3 bg-[#111] border border-[#333] text-white rounded-xl placeholder-[#555] focus:outline-none focus:border-[#00ff88] transition-colors resize-none"
              />
              <button
                type="submit"
                className="w-full py-3 bg-[#00ff88] text-[#0a0a0a] rounded-xl font-semibold text-sm hover:bg-[#00e07a] transition-colors"
              >
                Enviar mensaje
              </button>
            </form>

            {/* Contact info */}
            <div className="flex flex-col justify-center gap-4">
              <p className="text-[#888] mb-2">O contacta directamente:</p>
              <a
                href="https://wa.me/34611086892"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-xl font-semibold text-sm hover:bg-[#20bd5a] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
              <a
                href="mailto:obxaistudio@obxaistudio.com"
                className="flex items-center justify-center gap-2 px-6 py-3 border border-[#00ff88] text-[#00ff88] rounded-xl font-semibold text-sm hover:bg-[#00ff88] hover:text-[#0a0a0a] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
                obxaistudio@obxaistudio.com
              </a>
            </div>
          </div>
        </section>

        <div className="text-center mt-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-[#888] hover:text-[#f0f0f0] text-sm underline transition-colors"
          >
            ← Volver al dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
