"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FadeIn } from "@/components/animations/fade-in";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Device = {
  id: string;
  name: string;
  node_id: string;
  status: string;
  last_seen_at: string | null;
};

export function DevicesPanel({ devices }: { devices: Device[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function createDevice(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, node_id: nodeId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error ?? "No se pudo crear (¿migración / auth?)");
      return;
    }
    setName("");
    setNodeId("");
    setMsg("Nodo creado");
    router.refresh();
  }

  async function softDelete(id: string) {
    await fetch("/api/soft-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "devices", id, action: "soft_delete" }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <p className="mb-3 font-display text-lg">Alta de nodo ESP32</p>
        <form
          onSubmit={createDevice}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <Input
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            placeholder="node_id (esp32-03)"
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            required
          />
          <Button type="submit">Registrar</Button>
        </form>
        {msg ? <p className="mt-2 text-sm text-muted">{msg}</p> : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {devices.map((device, i) => (
          <FadeIn key={device.id} delay={i * 0.05}>
            <Card glow={device.status === "online"}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-lg">{device.name}</p>
                  <p className="font-mono text-xs text-muted">{device.node_id}</p>
                </div>
                <span
                  className={
                    device.status === "online"
                      ? "text-secondary"
                      : "text-accent"
                  }
                >
                  ● {device.status}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted">
                Last seen:{" "}
                {device.last_seen_at
                  ? new Date(device.last_seen_at).toLocaleString()
                  : "—"}
              </p>
              <Button
                className="mt-4"
                size="sm"
                variant="ghost"
                onClick={() => softDelete(device.id)}
              >
                Baja lógica
              </Button>
            </Card>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
