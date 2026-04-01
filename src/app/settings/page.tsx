// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

const planFeatures: Record<string, { label: string; price: string; features: string[] }> = {
  basico: {
    label: "Básico",
    price: "€99/mes",
    features: ["5 activos", "2 escáneres (puertos + SSL)", "1 escaneo/semana", "30 días historial"],
  },
  profesional: {
    label: "Profesional",
    price: "€199/mes",
    features: ["25 activos", "4 escáneres completos", "5 escaneos/día", "90 días historial", "Informes PDF"],
  },
  enterprise: {
    label: "Enterprise",
    price: "€299/mes",
    features: ["Activos ilimitados", "4 escáneres completos", "Escaneos ilimitados", "1 año historial", "PDF con logo", "Acceso API"],
  },
};

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setUser)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwords.newPass !== passwords.confirm) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" });
      return;
    }
    if (passwords.newPass.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.newPass,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Contraseña actualizada correctamente" });
        setPasswords({ current: "", newPass: "", confirm: "" });
      } else {
        setMessage({ type: "error", text: data.error || "Error al cambiar la contraseña" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión" });
    } finally {
      setSaving(false);
    }
  };

  const currentPlan = user?.plan || "basico";

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar plan={currentPlan} />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-[#f0f0f0] mb-6">Configuración</h1>

        {loading ? (
          <div className="animate-pulse text-[#888]">Cargando...</div>
        ) : (
          <div className="space-y-6 max-w-3xl">
            {/* Organization */}
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[#f0f0f0] mb-4">Organización</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[#888]">Nombre</label>
                  <p className="text-[#f0f0f0] font-medium">{user?.organizationName || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#888]">Plan actual</label>
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 uppercase tracking-wider">
                    {planFeatures[currentPlan]?.label || currentPlan}
                  </span>
                </div>
              </div>
            </div>

            {/* Plans comparison */}
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[#f0f0f0] mb-4">Planes disponibles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(planFeatures).map(([key, plan]) => (
                  <div key={key} className={`rounded-xl p-5 border ${
                    key === currentPlan
                      ? "border-[#00ff88] bg-[#00ff88]/5"
                      : "border-[#333] bg-[#111]"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-[#f0f0f0]">{plan.label}</h3>
                      {key === currentPlan && (
                        <span className="text-[10px] uppercase tracking-wider text-[#00ff88] font-bold">Actual</span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-[#f0f0f0] font-mono mb-4">{plan.price}</p>
                    <ul className="space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="text-sm text-[#888] flex items-center gap-2">
                          <span className="text-[#00ff88]">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    {key !== currentPlan && (
                      <button className="w-full mt-4 px-4 py-2 border border-[#00ff88] text-[#00ff88] rounded-xl text-sm font-bold hover:bg-[#00ff88]/10 transition-colors">
                        Cambiar plan
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* User Info */}
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[#f0f0f0] mb-4">Información de usuario</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[#888]">Nombre</label>
                  <p className="text-[#f0f0f0]">{user?.name || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#888]">Email</label>
                  <p className="text-[#f0f0f0] font-mono">{user?.email || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#888]">Rol</label>
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-[#222] text-[#888] border border-[#333] capitalize">
                    {user?.role || "admin"}
                  </span>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-[#181818] border border-[#222] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[#f0f0f0] mb-4">Cambiar contraseña</h2>
              {message && (
                <div className={`mb-4 p-3 rounded-xl text-sm ${
                  message.type === "success" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                }`}>
                  {message.text}
                </div>
              )}
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-1">Contraseña actual</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full bg-[#111] border border-[#333] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00ff88]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-1">Nueva contraseña</label>
                  <input
                    type="password"
                    value={passwords.newPass}
                    onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                    className="w-full bg-[#111] border border-[#333] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00ff88]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-1">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full bg-[#111] border border-[#333] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00ff88]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#00ff88] text-[#0a0a0a] rounded-xl text-sm font-bold hover:bg-[#00e07a] disabled:opacity-50 transition-colors"
                >
                  {saving ? "Guardando..." : "Cambiar contraseña"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
