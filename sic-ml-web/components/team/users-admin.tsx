"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Copy, Loader2, MailCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { roleLabel } from "@/lib/roles";

type Role = "admin" | "analista" | "viewer";
type User = { id: string; email: string; full_name: string; role: Role; is_active: boolean; created_at: string };

const blank = { full_name: "", email: "", role: "viewer" as Role, password: "" };

const selectClass =
  "h-11 min-w-0 flex-1 rounded-xl border border-border bg-background-elevated px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60";

export function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  // Credenciales devueltas una sola vez cuando el SMTP no está configurado.
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/users", { cache: "no-store" });
    const d = await r.json();
    if (r.ok) setUsers(d.users);
    else setMessage(d.error ?? "No se pudieron cargar las cuentas.");
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setMessage(d.error ?? "No se pudo crear la cuenta.");
    setForm(blank);
    setCopied(false);
    if (d.emailed) {
      setIssued(null);
      setMessage(`Cuenta creada. Credenciales enviadas por correo a ${d.user?.email}.`);
    } else {
      setIssued({ email: d.user?.email ?? "", password: d.password ?? "" });
      setMessage("Cuenta creada. SMTP no configurado: entrega estas credenciales al usuario (se muestran abajo una sola vez).");
    }
    void load();
  };

  const update = async (id: string, values: Partial<User> & { password?: string }) => {
    const r = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, ...values }),
    });
    const d = await r.json();
    if (!r.ok) return setMessage(d.error ?? "No se pudo actualizar.");
    if (values.password !== undefined) {
      setCopied(false);
      if (d.emailed) {
        setIssued(null);
        setMessage(`Contraseña restablecida. Nueva contraseña enviada por correo a ${d.user?.email}.`);
      } else {
        setIssued({ email: d.user?.email ?? "", password: d.password ?? "" });
        setMessage("Contraseña restablecida. SMTP no configurado: entrega la nueva contraseña al usuario (se muestra abajo una sola vez).");
      }
    } else {
      setMessage("Cuenta actualizada.");
    }
    void load();
  };

  const remove = async (id: string) => {
    if (!window.confirm("¿Dar de baja esta cuenta? Será baja lógica (soft delete).")) return;
    const r = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const d = await r.json();
    if (!r.ok) return setMessage(d.error ?? "No se pudo dar de baja.");
    setMessage("Cuenta dada de baja.");
    void load();
  };
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-display text-lg">Nueva cuenta</h2>
        <p className="mt-1 text-sm text-muted">Las cuentas nuevas entran con rol viewer; cámbialo después si corresponde.</p>
        <form onSubmit={create} className="mt-4 grid gap-3 md:grid-cols-4">
          <Input
            required
            minLength={2}
            aria-label="Nombre completo"
            placeholder="Nombre completo"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <Input
            required
            type="email"
            aria-label="Email"
            placeholder="correo@lab.local"
            autoComplete="off"
            spellCheck={false}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            required
            minLength={8}
            type="password"
            aria-label="Contraseña inicial (mínimo 8 caracteres)"
            placeholder="Contraseña inicial"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <div className="flex gap-2">
            <select
              aria-label="Rol inicial"
              className={selectClass}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              <option value="viewer">Viewer</option>
              <option value="analista">Analista</option>
              <option value="admin">Admin</option>
            </select>
            <Button disabled={busy} type="submit">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {busy ? "Creando…" : "Crear"}
            </Button>
          </div>
        </form>
      </Card>

      {message ? <p role="status" className="text-sm text-muted">{message}</p> : null}

      {issued ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4" role="status" aria-live="polite">
          <p className="flex items-center gap-2 text-sm font-medium text-warning">
            <MailCheck className="h-4 w-4" aria-hidden="true" />
            Credenciales de {issued.email} (muestra esta información una sola vez)
          </p>
          <dl className="mt-3 grid gap-2 font-mono text-sm sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <dt className="text-xs uppercase tracking-wider text-muted">Usuario</dt>
            <dd className="break-all">{issued.email}</dd>
            <dd />
            <dt className="text-xs uppercase tracking-wider text-muted">Contraseña</dt>
            <dd className="break-all font-semibold">{issued.password}</dd>
            <dd>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(`Usuario: ${issued.email}\nContraseña: ${issued.password}`);
                  setCopied(true);
                }}
              >
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </dd>
          </dl>
          <p className="mt-2 text-xs text-muted">El usuario debe cambiarla al iniciar sesión. No se almacena en ningún registro.</p>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Cargando cuentas…</p>
      ) : users.length ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-background-elevated text-xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="p-3">Cuenta</th>
                <th scope="col" className="p-3">Rol</th>
                <th scope="col" className="p-3">Creada</th>
                <th scope="col" className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-primary/5">
                  <td className="min-w-0 max-w-xs p-3">
                    <p className="truncate font-medium" title={u.full_name}>{u.full_name}</p>
                    <p className="truncate font-mono text-xs text-muted" title={u.email}>{u.email}</p>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Badge>{roleLabel[u.role]}</Badge>
                      <select
                        aria-label={`Rol de ${u.email}`}
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        value={u.role}
                        onChange={(e) => void update(u.id, { role: e.target.value as Role })}
                      >
                        <option value="admin">Admin</option>
                        <option value="analista">Analista</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                  </td>
                  <td className="whitespace-nowrap p-3 text-muted">
                    {new Date(u.created_at).toLocaleDateString("es-BO")}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const p = window.prompt("Nueva contraseña (mín. 8 caracteres):");
                          if (p && p.length >= 8) void update(u.id, { password: p });
                        }}
                      >
                        Contraseña
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => void remove(u.id)}>
                        Baja
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={Users} title="Sin cuentas registradas" description="Crea la primera cuenta desde el formulario de arriba." />
      )}
    </div>
  );
}

