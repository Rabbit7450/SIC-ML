"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthVisual } from "@/components/auth/auth-visual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error ?? "No se pudo crear la cuenta.");
      } else {
        setMessage("Cuenta creada con rol viewer en PostgreSQL. Ya puedes iniciar sesión.");
      }
    } catch {
      setMessage("No se pudo contactar el servidor.");
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
              <h1 className="font-display text-2xl">Registro</h1>
              <p className="mt-1 text-sm text-muted">Rol inicial: viewer (un admin puede promoverte).</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              aria-label="Nombre completo"
              placeholder="Nombre"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              aria-label="Email"
              type="email"
              placeholder="correo@lab.local"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              aria-label="Contraseña (mínimo 8 caracteres)"
              type="password"
              placeholder="Contraseña (mín. 8)"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando…" : "Crear cuenta"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs">
            <Link href="/login" className="text-primary hover:underline">Ya tengo cuenta</Link>
            {" · "}
            <Link href="/" className="text-primary hover:underline">Volver al inicio</Link>
          </p>
          {message ? <p role="status" className="mt-4 text-sm text-muted">{message}</p> : null}
        </AuthCard>
      </div>
    </div>
  );
}
