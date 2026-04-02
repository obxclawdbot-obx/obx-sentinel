import Link from "next/link";
import Image from "next/image";
import FaqItem from "./components/FaqItem";

const features = [
  {
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-[#00ff88]">
        <circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l4 4"/>
      </svg>
    ),
    title: "Escaneo de puertos",
    desc: "Detectamos servicios expuestos (MySQL, Redis, MongoDB, FTP) accesibles desde internet.",
  },
  {
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-[#00ff88]">
        <rect x="3" y="7" width="10" height="7" rx="2"/><path d="M5 7V5a3 3 0 016 0v2"/>
      </svg>
    ),
    title: "Análisis SSL/TLS",
    desc: "Certificados próximos a expirar, protocolos obsoletos (TLS 1.0/1.1), certificados autofirmados.",
  },
  {
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-[#00ff88]">
        <circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2.5 2 11 0 12M8 2c-2 2.5-2 11 0 12"/>
      </svg>
    ),
    title: "Auditoría DNS",
    desc: "SPF, DMARC, DKIM, registros peligrosos, transferencias de zona no autorizadas.",
  },
  {
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-[#00ff88]">
        <path d="M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z"/>
      </svg>
    ),
    title: "Cabeceras HTTP",
    desc: "Verificamos HSTS, CSP, X-Frame-Options y otras cabeceras de seguridad críticas.",
  },
  {
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-[#00ff88]">
        <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
      </svg>
    ),
    title: "Scoring CVSS",
    desc: "Cada hallazgo con puntuación de severidad estándar y recomendación de remediación.",
  },
  {
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-[#00ff88]">
        <path d="M4 6a4 4 0 018 0c0 4 2 5 2 5H2s2-1 2-5zM6 13a2 2 0 004 0"/>
      </svg>
    ),
    title: "Alertas",
    desc: "Notificaciones inmediatas cuando detectamos vulnerabilidades críticas en tus activos.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "49",
    features: ["3 activos", "3 scanners", "Scan semanal", "30 días historial", "Soporte email"],
    recommended: false,
  },
  {
    name: "Professional",
    price: "149",
    features: ["15 activos", "10 scanners", "Scans diarios", "90 días historial", "Alertas email", "Informes PDF", "Soporte prioritario"],
    recommended: true,
  },
  {
    name: "Business",
    price: "299",
    features: ["Activos ilimitados", "10 scanners + compliance", "Scans cada 6h", "365 días historial", "Credenciales filtradas", "Reports con logo", "API access", "Soporte dedicado"],
    recommended: false,
  },
];

const faqs = [
  {
    q: "¿Qué es una superficie de ataque?",
    a: "Es el conjunto de puntos expuestos a internet de tu empresa: dominios, subdominios, IPs, puertos abiertos, servicios web, certificados y configuraciones DNS. Todo lo que un atacante podría descubrir y explotar.",
  },
  {
    q: "¿Necesito instalar algo en mis servidores?",
    a: "No. OBX Sentinel es 100% externo. Escaneamos tu infraestructura desde fuera, exactamente como lo haría un atacante. No necesitas instalar agentes ni abrir puertos adicionales.",
  },
  {
    q: "¿Cada cuánto se realizan los escaneos?",
    a: "Depende de tu plan. Starter incluye escaneos semanales, Professional diarios, y Business cada 6 horas con monitorización continua.",
  },
  {
    q: "¿Es legal escanear mis propios dominios?",
    a: "Sí. Escanear activos de tu propiedad es completamente legal. Durante el onboarding verificamos que los dominios y las IPs que registras te pertenecen.",
  },
];

function HeroScoreAnimation() {
  const score = 87;
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-[#00ff88]/5 blur-2xl" />
      <svg width="120" height="120" viewBox="0 0 120 120" className="relative">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#1a1a1a" strokeWidth="6" />
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke="#00ff88" strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
        />
        <text x="60" y="54" textAnchor="middle" className="fill-[#00ff88] text-3xl font-black" style={{ fontSize: "28px" }}>B+</text>
        <text x="60" y="72" textAnchor="middle" className="fill-[#888888]" style={{ fontSize: "11px", fontFamily: "monospace" }}>87/100</text>
      </svg>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-[#060606] text-[#f0f0f0] min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#060606]/[0.92] backdrop-blur-xl border-b border-[#1a1a1a]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/obx-logo.png" alt="OBX" width={32} height={32} className="rounded-md" />
            <span className="text-lg font-semibold">OBX <span className="text-[#00ff88]">Sentinel</span></span>
          </div>
          <div className="hidden sm:flex items-center gap-8">
            <a href="#funciones" className="text-sm text-[#bbbbbb] hover:text-[#00ff88] transition-colors">Funciones</a>
            <a href="#precios" className="text-sm text-[#bbbbbb] hover:text-[#00ff88] transition-colors">Precios</a>
            <a href="#faq" className="text-sm text-[#bbbbbb] hover:text-[#00ff88] transition-colors">FAQ</a>
          </div>
          <Link
            href="/login"
            className="px-4 sm:px-5 py-2 border border-[#00ff88] text-[#00ff88] rounded-md text-sm font-medium hover:bg-[#00ff88] hover:text-[#060606] transition-colors"
          >
            Acceder
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 sm:px-8 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center relative overflow-hidden">
        {/* Gradient glow behind hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,_rgba(0,255,136,0.05)_0%,_transparent_70%)] pointer-events-none" />
        <div className="max-w-[800px] mx-auto relative">
          <div className="mb-8 animate-in">
            <HeroScoreAnimation />
          </div>
          <h1 className="text-2xl sm:text-[30.4px] font-light leading-snug mb-5 animate-in-delay-1">
            Monitoriza la <span className="text-[#00ff88]">superficie de ataque</span> de tu empresa
          </h1>
          <p className="text-base sm:text-[17px] text-[#bbbbbb] leading-relaxed mb-8 sm:mb-9 max-w-[640px] mx-auto animate-in-delay-2">
            Detectamos vulnerabilidades, puertos expuestos, certificados caducados y credenciales filtradas. Antes de que lo hagan los atacantes.
          </p>
          <div className="animate-in-delay-3">
            <Link
              href="/register"
              className="inline-block px-8 sm:px-9 py-3.5 bg-[#00ff88] text-[#060606] rounded-xl text-base font-semibold hover:bg-[#00e07a] transition-colors"
            >
              Empieza gratis →
            </Link>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="px-4 sm:px-8 pb-8 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[#555555]">
          <span>Análisis externo</span>
          <span className="text-[#333]">·</span>
          <span>Sin instalación</span>
          <span className="text-[#333]">·</span>
          <span>CVSS scoring</span>
          <span className="text-[#333]">·</span>
          <span>Datos cifrados</span>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-b border-[#1a1a1a] px-4 sm:px-8 py-8 sm:py-10">
        <div className="max-w-[1100px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: "10", label: "scanners" },
            { value: "24/7", label: "monitorización" },
            { value: "<5min", label: "detección" },
            { value: "CVSS", label: "scoring" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl sm:text-[28px] font-semibold text-[#00ff88] font-mono">{s.value}</p>
              <p className="text-xs sm:text-[13px] text-[#666666] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="funciones" className="px-4 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-[28.8px] font-semibold mb-3">
              Lo que <span className="text-[#00ff88]">escaneamos</span> por ti
            </h2>
            <p className="text-[#bbbbbb] text-base">Cobertura completa de tu superficie de ataque externa.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-[#181818] rounded-2xl p-7 sm:p-9 border border-[#181818] hover:border-[#00ff88]/30 transition-all card-hover"
              >
                <span className="block mb-4">{f.icon}</span>
                <h3 className="text-[17px] font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-[#bbbbbb] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="px-4 sm:px-8 py-16 sm:py-24 border-t border-[#1a1a1a]">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-[28.8px] font-semibold mb-3">
              Planes <span className="text-[#00ff88]">transparentes</span>
            </h2>
            <p className="text-[#bbbbbb] text-base">Sin compromiso. Cancela cuando quieras.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[960px] mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-7 sm:p-9 relative card-hover ${
                  plan.recommended
                    ? "glass border border-[#00ff88]/40 glow-green sm:col-span-2 lg:col-span-1"
                    : "glass border border-[#222222]"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00ff88] text-[#060606] text-[11px] font-bold px-3.5 py-1 rounded-full tracking-wide">
                    RECOMENDADO
                  </div>
                )}
                <h3 className="text-[15px] font-medium text-[#666666] mb-3">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">€{plan.price}</span>
                  <span className="text-sm text-[#666666]">/mes</span>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-[#bbbbbb]">
                      <span className="text-[#00ff88]">✓</span> {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                    plan.recommended
                      ? "bg-[#00ff88] text-[#060606] hover:bg-[#00e07a]"
                      : "border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-[#060606]"
                  }`}
                >
                  Empezar ahora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-4 sm:px-8 py-16 sm:py-24 border-t border-[#1a1a1a]">
        <div className="max-w-[700px] mx-auto">
          <h2 className="text-2xl sm:text-[28.8px] font-semibold text-center mb-12">
            Preguntas <span className="text-[#00ff88]">frecuentes</span>
          </h2>
          {faqs.map((faq) => (
            <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-8 py-16 sm:py-20 border-t border-[#1a1a1a] text-center">
        <h2 className="text-2xl sm:text-[28.8px] font-semibold mb-6">
          ¿Listo para <span className="text-[#00ff88]">proteger</span> tu empresa?
        </h2>
        <Link
          href="/register"
          className="inline-block px-8 sm:px-9 py-3.5 bg-[#00ff88] text-[#060606] rounded-xl text-base font-semibold hover:bg-[#00e07a] transition-colors"
        >
          Empieza gratis →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] px-4 sm:px-8 py-8 sm:py-10 text-center">
        <div className="flex items-center justify-center gap-2">
          <Image src="/obx-logo.png" alt="OBX" width={20} height={20} className="rounded-sm" />
          <p className="text-[13px] text-[#666666]">
            Un producto de <span className="text-[#bbbbbb]">OBX AI Studio</span> · © 2026
          </p>
        </div>
        <div className="flex justify-center gap-6 mt-3">
          <a href="#funciones" className="text-[13px] text-[#666666] hover:text-[#bbbbbb]">Funciones</a>
          <a href="#precios" className="text-[13px] text-[#666666] hover:text-[#bbbbbb]">Precios</a>
          <Link href="/login" className="text-[13px] text-[#666666] hover:text-[#bbbbbb]">Acceder</Link>
        </div>
      </footer>
    </div>
  );
}
