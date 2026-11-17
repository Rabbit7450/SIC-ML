"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

export type ReportRow = {
  id: string;
  title: string;
  report_type: string;
  summary: string | null;
  created_at: string;
};

export function ReportsPanel({
  reports,
  canWrite,
  demoMode,
}: {
  reports: ReportRow[];
  canWrite: boolean;
  demoMode: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (demoMode || !canWrite || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, summary }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "No se pudo crear el informe.");
      setTitle("");
      setSummary("");
      setMessage("Informe guardado en PostgreSQL.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el informe.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {canWrite ? <Card>
        <h2 className="font-display text-lg">Nuevo informe</h2>
        <p className="mt-1 text-sm text-muted">Registra una nota de análisis para el equipo.</p>
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <label className="space-y-1.5 text-sm">
            <span>Título</span>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} minLength={3} required placeholder="Resumen de actividad semanal" disabled={demoMode || busy} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span>Resumen</span>
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={3000} rows={3} placeholder="Hallazgos, contexto y próximos pasos" disabled={demoMode || busy} className="w-full resize-y rounded-lg border border-border bg-background-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-60" />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">{demoMode ? "Configura DATABASE_URL (PostgreSQL) para guardar informes." : message ?? "Los informes se almacenan en PostgreSQL."}</p>
            <Button type="submit" disabled={demoMode || busy || title.trim().length < 3}>{busy ? "Guardando…" : "Guardar informe"}</Button>
          </div>
          {message && !demoMode ? <p role="status" className="text-sm text-muted">{message}</p> : null}
        </form>
      </Card> : null}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg">Informes recientes</h2>
          <span className="text-xs text-muted">{reports.length} registros</span>
        </div>
        {reports.length ? reports.map((report) => (
          <Card key={report.id} className="flex items-start gap-3">
            <FileText className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{report.title}</p>
              {report.summary ? <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted">{report.summary}</p> : <p className="mt-1 text-sm text-muted">Sin resumen.</p>}
              <p className="mt-2 text-xs text-muted">{report.report_type} · {new Date(report.created_at).toLocaleString("es-BO")}</p>
            </div>
          </Card>
        )) : <EmptyState title="Todavía no hay informes" description="Crea el primer resumen del equipo o espera a que se registre uno." />}
      </section>
    </div>
  );
}
