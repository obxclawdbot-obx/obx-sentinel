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
            <a
              href="#contacto"
              className="inline-block px-8 sm:px-9 py-3.5 bg-[#00ff88] text-[#060606] rounded-xl text-base font-semibold hover:bg-[#00e07a] transition-colors"
            >
              Contactar →
            </a>
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
                <a
                  href="#contacto"
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                    plan.recommended
                      ? "bg-[#00ff88] text-[#060606] hover:bg-[#00e07a]"
                      : "border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-[#060606]"
                  }`}
                >
                  Contactar
                </a>
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

      {/* Contact Section */}
      <section id="contacto" className="px-4 sm:px-8 py-16 sm:py-20 border-t border-[#1a1a1a] scroll-mt-20">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-[28.8px] font-semibold mb-3">
              ¿Listo para <span className="text-[#00ff88]">proteger</span> tu empresa?
            </h2>
            <p className="text-[#bbbbbb]">
              Cuéntanos qué necesitas y te preparamos un presupuesto personalizado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Form */}
            <form
              action="https://formsubmit.co/obxaistudio@obxaistudio.com"
              method="POST"
              className="space-y-4"
            >
              <input type="hidden" name="_subject" value="Contacto desde OBX Sentinel" />
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
                className="w-full py-3 bg-[#00ff88] text-[#060606] rounded-xl font-semibold hover:bg-[#00e07a] transition-colors"
              >
                Enviar mensaje
              </button>
            </form>

            {/* Contact info */}
            <div className="flex flex-col justify-center gap-4">
              <p className="text-[#bbbbbb] mb-2">O contacta directamente:</p>
              <a
                href="https://wa.me/34611086892"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-[#20bd5a] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
              <a
                href="mailto:obxaistudio@obxaistudio.com"
                className="flex items-center justify-center gap-2 px-6 py-3 border border-[#00ff88] text-[#00ff88] rounded-xl font-semibold hover:bg-[#00ff88] hover:text-[#060606] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
                obxaistudio@obxaistudio.com
              </a>
            </div>
          </div>
        </div>
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
