"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", organizationName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setLoading(false);
    } else {
      router.push("/login?registered=true");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0]">
            <Image src="/obx-logo.png" alt="OBX" width={48} height={48} className="mx-auto mb-3 rounded-lg" />
            OBX <span className="text-[#00ff88]">Sentinel</span>
          </h1>
          <p className="text-[#888] mt-2">Crear cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#181818] rounded-2xl p-6 border border-[#222]">
          <h2 className="text-xl font-semibold text-[#f0f0f0] mb-6">Registro</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#888] mb-1">Nombre de la empresa</label>
              <input
                type="text"
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00ff88]"
                placeholder="Empresa S.L."
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#888] mb-1">Tu nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00ff88]"
                placeholder="Juan García"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#888] mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00ff88]"
                placeholder="tu@empresa.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#888] mb-1">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00ff88]"
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[#00ff88] hover:bg-[#00e07a] text-[#0a0a0a] font-bold py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>

          <p className="text-center text-[#888] text-sm mt-4">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-[#00ff88] hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
