import Link from "next/link";
import FaqItem from "./components/FaqItem";

const features = [
  { icon: "🔍", title: "Escaneo de puertos", desc: "Detectamos servicios expuestos (MySQL, Redis, MongoDB, FTP) accesibles desde internet." },
  { icon: "🔒", title: "Análisis SSL/TLS", desc: "Certificados próximos a expirar, protocolos obsoletos (TLS 1.0/1.1), certificados autofirmados." },
  { icon: "🌐", title: "Auditoría DNS", desc: "SPF, DMARC, DKIM, registros peligrosos, transferencias de zona no autorizadas." },
  { icon: "🛡️", title: "Cabeceras HTTP", desc: "Verificamos HSTS, CSP, X-Frame-Options y otras cabeceras de seguridad críticas." },
  { icon: "📊", title: "Scoring CVSS", desc: "Cada hallazgo con puntuación de severidad estándar y recomendación de remediación." },
  { icon: "🔔", title: "Alertas", desc: "Notificaciones inmediatas cuando detectamos vulnerabilidades críticas en tus activos." },
];

const plans = [
  {
    name: "Básico",
    price: "99",
    features: ["5 activos", "Escaneos semanales", "Alertas email", "Soporte email"],
    recommended: false,
  },
  {
    name: "Profesional",
    price: "199",
    features: ["25 activos", "Escaneos diarios", "Alertas email + Slack", "API access", "Soporte prioritario"],
    recommended: true,
  },
  {
    name: "Enterprise",
    price: "299",
    features: ["Activos ilimitados", "Escaneos continuos", "Integraciones custom", "SLA 99.9%", "Soporte dedicado"],
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
    a: "Depende de tu plan. El plan Básico incluye escaneos semanales, el Profesional diarios, y el Enterprise ofrece monitorización continua con detección en menos de 5 minutos.",
  },
  {
    q: "¿Es legal escanear mis propios dominios?",
    a: "Sí. Escanear activos de tu propiedad es completamente legal. Durante el onboarding verificamos que los dominios y las IPs que registras te pertenecen.",
  },
];

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "#060606", color: "#f0f0f0", minHeight: "100vh" }}>
      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "rgba(6,6,6,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "24px" }}>🛡️</span>
            <span style={{ fontSize: "18px", fontWeight: 600, color: "#f0f0f0" }}>OBX <span style={{ color: "#00ff88" }}>Sentinel</span></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <a href="#funciones" style={{ fontSize: "14px", color: "#bbbbbb", textDecoration: "none" }}>Funciones</a>
            <a href="#precios" style={{ fontSize: "14px", color: "#bbbbbb", textDecoration: "none" }}>Precios</a>
            <a href="#faq" style={{ fontSize: "14px", color: "#bbbbbb", textDecoration: "none" }}>FAQ</a>
          </div>
          <Link
            href="/login"
            style={{
              padding: "8px 20px",
              backgroundColor: "transparent",
              color: "#00ff88",
              border: "1px solid #00ff88",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Acceder
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "100px 32px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "30.4px", fontWeight: 300, lineHeight: 1.4, marginBottom: "20px", color: "#f0f0f0" }}>
            Monitoriza la <span style={{ color: "#00ff88" }}>superficie de ataque</span> de tu empresa
          </h1>
          <p style={{ fontSize: "17px", color: "#bbbbbb", lineHeight: 1.7, marginBottom: "36px", maxWidth: "640px", marginLeft: "auto", marginRight: "auto" }}>
            Detectamos vulnerabilidades, puertos expuestos, certificados caducados y credenciales filtradas. Antes de que lo hagan los atacantes.
          </p>
          <Link
            href="/register"
            style={{
              display: "inline-block",
              padding: "14px 36px",
              backgroundColor: "#00ff88",
              color: "#060606",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Empieza gratis →
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section style={{ borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", padding: "40px 32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", textAlign: "center" }}>
          {[
            { value: "4", label: "scanners" },
            { value: "24/7", label: "monitorización" },
            { value: "<5min", label: "detección" },
            { value: "CVSS", label: "scoring" },
          ].map((s) => (
            <div key={s.label}>
              <p style={{ fontSize: "28px", fontWeight: 600, color: "#00ff88" }}>{s.value}</p>
              <p style={{ fontSize: "13px", color: "#666666", marginTop: "4px" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="funciones" style={{ padding: "100px 32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "28.8px", fontWeight: 600, color: "#f0f0f0", marginBottom: "12px" }}>
              Lo que <span style={{ color: "#00ff88" }}>escaneamos</span> por ti
            </h2>
            <p style={{ color: "#bbbbbb", fontSize: "16px" }}>Cobertura completa de tu superficie de ataque externa.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {features.map((f) => (
              <div
                key={f.title}
                style={{
                  backgroundColor: "#181818",
                  borderRadius: "14px",
                  padding: "35px",
                  border: "1px solid #181818",
                }}
              >
                <span style={{ fontSize: "32px", display: "block", marginBottom: "16px" }}>{f.icon}</span>
                <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#f0f0f0", marginBottom: "8px" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: "#bbbbbb", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" style={{ padding: "100px 32px", borderTop: "1px solid #1a1a1a" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "28.8px", fontWeight: 600, color: "#f0f0f0", marginBottom: "12px" }}>
              Planes <span style={{ color: "#00ff88" }}>transparentes</span>
            </h2>
            <p style={{ color: "#bbbbbb", fontSize: "16px" }}>Sin compromiso. Cancela cuando quieras.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", maxWidth: "960px", margin: "0 auto" }}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                style={{
                  backgroundColor: "#0c0c0c",
                  borderRadius: "14px",
                  padding: "35px",
                  border: plan.recommended ? "1px solid #00ff88" : "1px solid #181818",
                  position: "relative",
                }}
              >
                {plan.recommended && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "#00ff88",
                      color: "#060606",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "4px 14px",
                      borderRadius: "20px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    RECOMENDADO
                  </div>
                )}
                <h3 style={{ fontSize: "15px", fontWeight: 500, color: "#666666", marginBottom: "12px" }}>{plan.name}</h3>
                <div style={{ marginBottom: "24px" }}>
                  <span style={{ fontSize: "36px", fontWeight: 700, color: "#f0f0f0" }}>€{plan.price}</span>
                  <span style={{ fontSize: "14px", color: "#666666" }}>/mes</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px 0" }}>
                  {plan.features.map((feat) => (
                    <li key={feat} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#bbbbbb", marginBottom: "10px" }}>
                      <span style={{ color: "#00ff88" }}>✓</span> {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "12px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 600,
                    textDecoration: "none",
                    backgroundColor: plan.recommended ? "#00ff88" : "transparent",
                    color: plan.recommended ? "#060606" : "#00ff88",
                    border: plan.recommended ? "none" : "1px solid #00ff88",
                  }}
                >
                  Empezar ahora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: "100px 32px", borderTop: "1px solid #1a1a1a" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "28.8px", fontWeight: 600, color: "#f0f0f0", textAlign: "center", marginBottom: "48px" }}>
            Preguntas <span style={{ color: "#00ff88" }}>frecuentes</span>
          </h2>
          {faqs.map((faq) => (
            <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 32px", borderTop: "1px solid #1a1a1a", textAlign: "center" }}>
        <h2 style={{ fontSize: "28.8px", fontWeight: 600, color: "#f0f0f0", marginBottom: "24px" }}>
          ¿Listo para <span style={{ color: "#00ff88" }}>proteger</span> tu empresa?
        </h2>
        <Link
          href="/register"
          style={{
            display: "inline-block",
            padding: "14px 36px",
            backgroundColor: "#00ff88",
            color: "#060606",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Empieza gratis →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #1a1a1a", padding: "40px 32px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "#666666" }}>
          Un producto de <span style={{ color: "#bbbbbb" }}>OBX AI Studio</span> · © 2026
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "12px" }}>
          <a href="#funciones" style={{ fontSize: "13px", color: "#666666", textDecoration: "none" }}>Funciones</a>
          <a href="#precios" style={{ fontSize: "13px", color: "#666666", textDecoration: "none" }}>Precios</a>
          <Link href="/login" style={{ fontSize: "13px", color: "#666666", textDecoration: "none" }}>Acceder</Link>
        </div>
      </footer>
    </div>
  );
}
