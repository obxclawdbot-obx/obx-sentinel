// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

interface ComplianceCheck {
  id: string;
  label: string;
  description: string;
  passed: boolean;
  relatedFindings: number;
  autoEvaluated: boolean;
}

interface Framework {
  id: string;
  name: string;
  checks: ComplianceCheck[];
  score: number;
}

const frameworkIcons: Record<string, JSX.Element> = {
  gdpr: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z" />
      <path d="M6 8h4M8 6v4" />
    </svg>
  ),
  ens: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <rect x="2" y="3" width="12" height="10" rx="2" />
      <path d="M2 7h12M6 7v6M10 7v6" />
    </svg>
  ),
  iso27001: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4v4l2.5 2.5" />
    </svg>
  ),
};

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? "#00ff88" : score >= 60 ? "#eab308" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#222" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold font-mono" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}

export default function CompliancePage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("gdpr");
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/compliance")
      .then((r) => r.json())
      .then((data) => {
        setFrameworks(data.frameworks || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleOverride = (checkId: string) => {
    setOverrides((prev) => ({ ...prev, [checkId]: !prev[checkId] }));
  };

  const activeFramework = frameworks.find((f) => f.id === activeTab);

  const getEffectiveScore = (fw: Framework) => {
    const checks = fw.checks;
    const passing = checks.filter((c) => overrides[c.id] !== undefined ? overrides[c.id] : c.passed).length;
    return Math.round((passing / checks.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar />
        <main className="flex-1 p-8 bg-grid">
          <div className="skeleton h-7 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#181818] border border-[#222] rounded-2xl p-6">
                <div className="skeleton h-5 w-40 mb-4" />
                <div className="skeleton h-20 w-20 rounded-full mx-auto" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 p-8 bg-grid">
        <h1 className="text-2xl font-bold text-[#f0f0f0] mb-6 animate-in">Cumplimiento Normativo</h1>

        {/* Framework overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-in">
          {frameworks.map((fw) => {
            const effectiveScore = getEffectiveScore(fw);
            return (
              <button
                key={fw.id}
                onClick={() => setActiveTab(fw.id)}
                className={`bg-[#181818] border rounded-2xl p-6 text-left transition-all card-hover ${
                  activeTab === fw.id ? "border-[#00ff88]" : "border-[#222]"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className={activeTab === fw.id ? "text-[#00ff88]" : "text-[#888]"}>
                    {frameworkIcons[fw.id]}
                  </span>
                  <h3 className="text-sm font-semibold text-[#f0f0f0]">{fw.name}</h3>
                </div>
                <div className="flex items-center justify-between">
                  <ScoreRing score={effectiveScore} size={70} />
                  <div className="text-right">
                    <p className="text-xs text-[#888]">
                      {fw.checks.filter((c) => overrides[c.id] !== undefined ? overrides[c.id] : c.passed).length}/{fw.checks.length} controles
                    </p>
                    <p className="text-xs text-[#555] mt-1">superados</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active framework detail */}
        {activeFramework && (
          <div className="bg-[#181818] border border-[#222] rounded-2xl p-6 animate-in-delay-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#f0f0f0]">{activeFramework.name}</h2>
              <span className="text-sm font-mono text-[#888]">
                {getEffectiveScore(activeFramework)}% cumplimiento
              </span>
            </div>

            <div className="space-y-3">
              {activeFramework.checks.map((check) => {
                const effectivePassed = overrides[check.id] !== undefined ? overrides[check.id] : check.passed;
                const isExpanded = expandedCheck === check.id;

                return (
                  <div
                    key={check.id}
                    className={`rounded-xl border transition-all ${
                      effectivePassed ? "bg-[#00ff88]/5 border-[#00ff88]/20" : "bg-red-500/5 border-red-500/20"
                    }`}
                  >
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer"
                      onClick={() => setExpandedCheck(isExpanded ? null : check.id)}
                    >
                      {/* Status icon */}
                      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold" style={{
                        backgroundColor: effectivePassed ? "rgba(0,255,136,0.15)" : "rgba(239,68,68,0.15)",
                        color: effectivePassed ? "#00ff88" : "#ef4444",
                      }}>
                        {effectivePassed ? "✓" : "✗"}
                      </span>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#f0f0f0]">{check.label}</p>
                        {check.relatedFindings > 0 && (
                          <span className="text-xs text-[#888]">
                            {check.relatedFindings} hallazgo{check.relatedFindings !== 1 ? "s" : ""} relacionado{check.relatedFindings !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {/* Manual override */}
                      {check.autoEvaluated && (
                        <label
                          className="flex items-center gap-2 text-xs text-[#555] cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={overrides[check.id] !== undefined ? overrides[check.id] : check.passed}
                            onChange={() => toggleOverride(check.id)}
                            className="accent-[#00ff88] w-3.5 h-3.5"
                          />
                          Override
                        </label>
                      )}

                      {!check.autoEvaluated && (
                        <label
                          className="flex items-center gap-2 text-xs text-[#888] cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={overrides[check.id] || false}
                            onChange={() => toggleOverride(check.id)}
                            className="accent-[#00ff88] w-3.5 h-3.5"
                          />
                          Manual
                        </label>
                      )}

                      {/* Expand arrow */}
                      <svg
                        viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                        className={`w-4 h-4 text-[#555] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <path d="M4 6l4 4 4-4" />
                      </svg>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-[#222]">
                        <p className="text-xs text-[#888] mt-3">{check.description}</p>
                        {check.relatedFindings > 0 && (
                          <a
                            href={`/findings?search=${encodeURIComponent(check.label)}`}
                            className="inline-flex items-center gap-1 mt-2 text-xs text-[#00ff88] hover:underline"
                          >
                            Ver hallazgos relacionados →
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
