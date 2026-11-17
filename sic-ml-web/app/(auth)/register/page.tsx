"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card/80 p-8"
      >
        <h1 className="font-display text-2xl">Registro</h1>
        <p className="mt-1 text-sm text-muted">
          Rol inicial: viewer (un admin puede promoverte).
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
        <Link
          href="/login"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Ya tengo cuenta
        </Link>
        {message ? (
          <p className="mt-4 text-sm text-muted">{message}</p>
        ) : null}
      </motion.div>
    </div>
  );
}
