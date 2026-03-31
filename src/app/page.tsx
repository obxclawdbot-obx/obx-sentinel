// @ts-nocheck
import Link from "next/link";

const features = [
  {
    icon: "🔄",
    title: "Escaneo continuo",
    desc: "Monitorización 24/7 de tu superficie de ataque. Detecta cambios, puertos abiertos y configuraciones inseguras automáticamente.",
  },
  {
    icon: "🚨",
    title: "Alertas en tiempo real",
    desc: "Recibe notificaciones inmediatas cuando se detectan vulnerabilidades críticas o cambios sospechosos en tus activos.",
  },
  {
    icon: "📊",
    title: "Informes CVSS",
    desc: "Clasificación y priorización de hallazgos según el estándar CVSS. Informes claros para equipos técnicos y dirección.",
  },
  {
    icon: "🛡️",
    title: "Panel centralizado",
    desc: "Visión completa de tu postura de seguridad en un solo panel. Security Score, tendencias y métricas clave.",
  },
];

const plans = [
  {
    name: "Básico",
    price: "99",
    features: ["Hasta 10 activos", "Escaneos diarios", "Alertas por email", "Informes mensuales", "Soporte por email"],
    cta: "Empezar",
    highlight: false,
  },
  {
    name: "Profesional",
    price: "199",
    features: ["Hasta 50 activos", "Escaneos cada hora", "Alertas multicanal", "Informes semanales", "API access", "Soporte prioritario"],
    cta: "Más popular",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "299",
    features: ["Activos ilimitados", "Escaneo continuo", "Integraciones SIEM", "Informes personalizados", "SLA garantizado", "Account manager dedicado"],
    cta: "Contactar",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="text-xl font-bold text-gray-900">OBX Sentinel</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Características</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Precios</a>
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span>⚡</span> Ciberseguridad para pymes
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Monitoriza tu<br />
            <span className="text-blue-600">superficie de ataque</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Descubre vulnerabilidades antes que los atacantes. Escaneo continuo, alertas en tiempo real
            y panel centralizado para proteger tu negocio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Prueba gratis →
            </Link>
            <a
              href="#features"
              className="px-8 py-3.5 bg-gray-100 text-gray-700 rounded-xl text-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Ver características
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-gray-900 py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-white">500+</p>
            <p className="text-sm text-gray-400 mt-1">Activos monitorizados</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">99.9%</p>
            <p className="text-sm text-gray-400 mt-1">Uptime garantizado</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">&lt;5min</p>
            <p className="text-sm text-gray-400 mt-1">Tiempo de detección</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">24/7</p>
            <p className="text-sm text-gray-400 mt-1">Monitorización continua</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Todo lo que necesitas para proteger tu negocio</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Herramientas profesionales de ciberseguridad, accesibles para pymes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-8 shadow-sm border hover:shadow-md transition-shadow">
                <span className="text-4xl mb-4 block">{f.icon}</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Planes adaptados a tu empresa</h2>
            <p className="text-lg text-gray-600">Sin compromiso. Cancela cuando quieras.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.highlight
                    ? "bg-blue-600 text-white ring-4 ring-blue-200 scale-105"
                    : "bg-white border shadow-sm"
                }`}
              >
                <h3 className={`text-lg font-semibold mb-2 ${plan.highlight ? "text-blue-100" : "text-gray-500"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                    €{plan.price}
                  </span>
                  <span className={plan.highlight ? "text-blue-200" : "text-gray-500"}>/mes</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-blue-100" : "text-gray-600"}`}>
                      <span className={plan.highlight ? "text-white" : "text-green-500"}>✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <span className="text-white font-bold">OBX Sentinel</span>
            <span className="text-sm ml-2">by OBX AI Studio</span>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#features" className="hover:text-white transition-colors">Características</a>
            <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
            <Link href="/login" className="hover:text-white transition-colors">Acceder</Link>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} OBX AI Studio. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
