"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthVisual } from "@/components/auth/auth-visual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@lab.local");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo iniciar sesión.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <AuthVisual />
      <div className="flex items-center justify-center px-4 py-10">
        <AuthCard>
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-xl">SIC-ML</p>
              <p className="text-xs text-muted">Acceso seguro al centro de operaciones</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs text-muted">Email</label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs text-muted">Contraseña</label>
              <div className="relative">
                <Input
                  id="password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-11"
                />
                <button
                  type="button"
                  aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={visible}
                  onClick={() => setVisible(!visible)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Validando…" : "Iniciar sesión"}
            </Button>
          </form>

          {message && (
            <p role="alert" className="mt-4 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-foreground">
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-xs text-muted">Autenticación local mediante PostgreSQL (bcrypt vía pgcrypto).</p>
          <p className="mt-3 text-center text-xs">
            <Link href="/register" className="text-primary hover:underline">Crear cuenta nueva</Link>
            {" · "}
            <Link href="/" className="text-primary hover:underline">Volver al inicio</Link>
          </p>
        </AuthCard>
      </div>
    </div>
  );
}
