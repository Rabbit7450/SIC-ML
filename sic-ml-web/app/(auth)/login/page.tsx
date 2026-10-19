"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    try {
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        setMessage("Revisa tu correo: te enviamos un magic link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar sesión. Revisa las variables de Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card/80 p-8 shadow-[0_0_40px_rgba(245,158,11,0.12)] backdrop-blur"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <TreePine className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-xl">SIC-ML</p>
            <p className="text-xs text-muted">Acceso al laboratorio</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-muted">Email</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analista@lab.local"
            />
          </div>
          {mode === "password" ? (
            <div>
              <label className="mb-1.5 block text-xs text-muted">
                Contraseña
              </label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Entrando…"
              : mode === "magic"
                ? "Enviar magic link"
                : "Iniciar sesión"}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() =>
              setMode((m) => (m === "password" ? "magic" : "password"))
            }
          >
            {mode === "password" ? "Usar magic link" : "Usar contraseña"}
          </button>
          <Link href="/register" className="text-muted hover:text-foreground">
            Crear cuenta
          </Link>
        </div>

        {message ? (
          <p className="mt-4 rounded-xl border border-border bg-background-elevated px-3 py-2 text-sm text-muted">
            {message}
          </p>
        ) : null}

        <p className="mt-6 text-center text-[11px] text-muted">
          Sin claves de Supabase el dashboard abre en modo demo.
        </p>
      </motion.div>
    </div>
  );
}
