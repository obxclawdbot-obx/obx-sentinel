"use client";
import { useState } from "react";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<{ findings: number; severity: string } | null>(null);
  const [error, setError] = useState("");

  const startScan = async () => {
    if (!domain.trim()) return;
    setScanning(true);
    setStep(2);
    setError("");

    try {
      // Create asset
      const assetRes = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "domain", value: domain.trim() }),
      });
      
      if (!assetRes.ok) {
        const data = await assetRes.json();
        setError(data.error || "Error al añadir el dominio");
        setStep(1);
        setScanning(false);
        return;
      }

      const asset = await assetRes.json();

      // Launch scan
      const scanRes = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: asset.id }),
      });

      if (!scanRes.ok) {
        setStep(3);
        setResults({ findings: 0, severity: "info" });
        setScanning(false);
        return;
      }

      const scanData = await scanRes.json();
      
      // Poll for completion
      const pollScan = async () => {
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const res = await fetch(`/api/scan?id=${scanData.scan.id}`);
          const scan = await res.json();
          if (scan.status === "completed" || scan.status === "failed") {
            const findingsCount = scan.findings?.length || 0;
            const worstSeverity = scan.findings?.reduce((worst: string, f: any) => {
              const order = ["info", "low", "medium", "high", "critical"];
              return order.indexOf(f.severity) > order.indexOf(worst) ? f.severity : worst;
            }, "info") || "info";
            setResults({ findings: findingsCount, severity: worstSeverity });
            setStep(3);
            setScanning(false);
            return;
          }
        }
        setResults({ findings: 0, severity: "info" });
        setStep(3);
        setScanning(false);
      };

      pollScan();
    } catch {
      setError("Error de conexión");
      setStep(1);
      setScanning(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-3 h-3 rounded-full transition-colors ${
              s === step ? "bg-[#00ff88]" : s < step ? "bg-[#00ff88]/40" : "bg-[#333]"
            }`} />
          ))}
        </div>

        {step === 1 && (
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🌐</div>
            <h2 className="text-2xl font-bold text-[#f0f0f0] mb-2">Añade tu primer dominio</h2>
            <p className="text-[#888] mb-6">Introduce el dominio de tu empresa para analizar su superficie de ataque.</p>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="ejemplo.com"
              className="w-full bg-[#111] border border-[#333] text-white rounded-xl px-4 py-3 text-center font-mono text-lg focus:outline-none focus:border-[#00ff88] mb-4"
              onKeyDown={e => e.key === "Enter" && startScan()}
              autoFocus
            />

            <button
              onClick={startScan}
              disabled={!domain.trim()}
              className="w-full bg-[#00ff88] text-[#0a0a0a] font-bold py-3 rounded-xl hover:bg-[#00e07a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Escanear dominio →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-[#00ff88]/30">
                <div className="w-12 h-12 rounded-full border-2 border-[#00ff88] border-t-transparent animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#f0f0f0] mb-2">Escaneando...</h2>
            <p className="text-[#888] mb-2">Analizando <span className="font-mono text-[#00ff88]">{domain}</span></p>
            <p className="text-[#555] text-sm">Puertos · SSL · DNS · Headers</p>
            
            <div className="mt-6 space-y-2">
              {["Resolviendo DNS...", "Escaneando puertos...", "Verificando SSL...", "Analizando headers..."].map((text, i) => (
                <div key={i} className="flex items-center gap-2 justify-center text-sm text-[#666]"
                  style={{ animation: `fadeIn 0.5s ease ${i * 0.8}s both` }}>
                  <span className="text-[#00ff88]">▸</span> {text}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && results && (
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">{results.findings > 0 ? "⚠️" : "✅"}</div>
            <h2 className="text-2xl font-bold text-[#f0f0f0] mb-2">Resultados del escaneo</h2>
            <p className="text-[#888] mb-6">
              Hemos encontrado <span className="text-[#00ff88] font-bold">{results.findings}</span> hallazgos en <span className="font-mono text-[#f0f0f0]">{domain}</span>
            </p>
            
            {results.findings > 0 && (
              <div className="bg-[#111] rounded-xl p-4 mb-6">
                <p className="text-sm text-[#888]">Severidad máxima detectada</p>
                <p className={`text-lg font-bold uppercase mt-1 ${
                  results.severity === "critical" ? "text-red-500" :
                  results.severity === "high" ? "text-orange-500" :
                  results.severity === "medium" ? "text-yellow-500" :
                  "text-green-500"
                }`}>
                  {results.severity}
                </p>
              </div>
            )}

            <button
              onClick={onComplete}
              className="w-full bg-[#00ff88] text-[#0a0a0a] font-bold py-3 rounded-xl hover:bg-[#00e07a] transition-colors"
            >
              Ir al dashboard →
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
