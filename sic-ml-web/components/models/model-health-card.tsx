"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type NeuralStatus = {
  status: "verified" | "evaluated" | "not_trained" | "artifact_unverified" | "metrics_only" | "load_error" | "unknown";
  artifact_present?: boolean;
  metrics_present?: boolean;
  validation_f1?: number | null;
  test_f1?: number | null;
  accuracy?: number | null;
  test_set?: string;
};

type Health = {
  service_available: boolean;
  status?: "not_configured" | "unreachable";
  detail?: string;
  active_model?: string | null;
  model_loaded?: boolean;
  evaluated_at?: string | null;
  selection_metric?: string | null;
  neural_network: NeuralStatus;
};

const nnLabels: Record<NeuralStatus["status"], string> = {
  verified: "Entrenada, evaluada y activa",
  evaluated: "Entrenada y evaluada; no es el modelo activo",
  not_trained: "Sin entrenamiento ni artefacto",
  artifact_unverified: "Artefacto presente, métricas no verificadas",
  metrics_only: "Métricas presentes, falta el artefacto ejecutable",
  load_error: "No se pudo cargar el artefacto",
  unknown: "Estado no disponible",
};

function metric(value?: number | null) {
  return typeof value === "number" ? `${(value * 100).toFixed(2)}%` : "—";
}

export function ModelHealthCard() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/models/health", { cache: "no-store" });
      const data = (await response.json()) as Health;
      setHealth(data);
    } catch {
      setHealth({
        service_available: false,
        status: "unreachable",
        detail: "No se pudo leer el estado del servicio.",
        neural_network: { status: "unknown" },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const nn = health?.neural_network;
  const isVerified = nn?.status === "verified";

  return (
    <Card className="border-l-[3px] border-l-primary">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-lg">Verificación del servicio IDS</h2>
            <p className="mt-1 text-sm text-muted">Estado del artefacto activo y comprobación de la red neuronal.</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          {loading ? "Consultando…" : "Verificar ahora"}
        </Button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-border bg-background/60 p-4" aria-live="polite">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Servicio de inferencia</h3>
            <Badge className={health?.service_available ? "border-secondary/30 bg-secondary/10 text-secondary" : "border-warning/30 bg-warning/10 text-warning"}>
              {loading ? "consultando" : health?.service_available ? (health.model_loaded ? "modelo cargado" : "sin modelo") : health?.status === "not_configured" ? "no configurado" : "sin conexión"}
            </Badge>
          </div>
          {health?.service_available ? (
            <p className="mt-2 text-sm text-muted">Modelo activo: <span className="font-medium text-foreground">{health.active_model ?? "ninguno"}</span></p>
          ) : (
            <p className="mt-2 text-sm text-muted">{health?.detail ?? "Esperando respuesta del servicio."}</p>
          )}
        </section>

        <section className="rounded-lg border border-border bg-background/60 p-4" aria-live="polite">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Red neuronal NSL-KDD</h3>
            <Badge className={isVerified ? "border-secondary/30 bg-secondary/10 text-secondary" : "border-warning/30 bg-warning/10 text-warning"}>
              {loading ? "consultando" : nnLabels[nn?.status ?? "unknown"]}
            </Badge>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div><p className="text-muted">F1 validación</p><p className="mt-1 font-semibold text-foreground">{metric(nn?.validation_f1)}</p></div>
            <div><p className="text-muted">F1 test</p><p className="mt-1 font-semibold text-foreground">{metric(nn?.test_f1)}</p></div>
            <div><p className="text-muted">Exactitud</p><p className="mt-1 font-semibold text-foreground">{metric(nn?.accuracy)}</p></div>
          </div>
          {nn?.test_set ? <p className="mt-3 text-[11px] leading-4 text-muted">Evaluación: {nn.test_set}</p> : null}
        </section>
      </div>

      {!loading && nn?.status === "not_trained" ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-warning/5 p-3 text-xs leading-5 text-muted">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          El repositorio no contiene pesos de la red neuronal ni métricas de su evaluación. Las métricas de Random Forest/SVM no verifican una red neuronal.
        </p>
      ) : null}
      {health?.evaluated_at ? <p className="mt-3 text-xs text-muted">Evaluación registrada: {new Date(health.evaluated_at).toLocaleString("es-BO")}</p> : null}
    </Card>
  );
}
