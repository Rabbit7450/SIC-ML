"use client";

import { FormEvent, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { PhishingResultCard } from "@/components/phishing/phishing-result-card";
import type { PhishingHistoryItem } from "@/lib/phishing";

const PAGE_SIZE = 5;

/**
 * Único apartado de phishing: un formulario (blocklist + modelo ML vía
 * /api/phishing, que guarda en PostgreSQL) y un solo historial.
 */
export function PhishingPanel({
  initialHistory,
  canWrite,
}: {
  initialHistory: PhishingHistoryItem[];
  canWrite: boolean;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PhishingHistoryItem[]>(initialHistory);
  const [page, setPage] = useState(1);

  const visible = history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canWrite || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/phishing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo analizar la URL");
        return;
      }
      setHistory((h) => [{ ...(data as PhishingHistoryItem) }, ...h].slice(0, 12));
      setUrl("");
    } catch {
      setError("Error de red al contactar la API");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6" aria-label="Análisis anti-phishing">
      <FadeIn>
        <Card glow>
          {canWrite ? (
            <>
              <div className="mb-4">
                <h2 className="font-display text-lg">Analizar una URL</h2>
                <p className="mt-1 text-sm text-muted">
                  Veredicto con la lista de phishing conocida + modelo ML. El resultado se guarda en PostgreSQL.
                </p>
              </div>
              <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
                <label className="sr-only" htmlFor="phish-url">URL a analizar</label>
                <Input
                  id="phish-url"
                  placeholder="https://ejemplo.com o URL sospechosa"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  maxLength={2048}
                  disabled={loading}
                  aria-label="URL a analizar"
                />
                <Button type="submit" disabled={loading || !url.trim()}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  )}
                  Analizar
                </Button>
              </form>
              {error && (
                <p role="alert" className="mt-3 text-sm text-accent">
                  {error}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">
              El rol de solo lectura puede revisar el historial, pero no registrar nuevos análisis.
            </p>
          )}
        </Card>
      </FadeIn>

      <section className="space-y-3" aria-labelledby="phishing-history-title">
        <div className="flex items-baseline justify-between">
          <h2 id="phishing-history-title" className="font-display text-lg">Historial de análisis</h2>
          <span className="text-xs text-muted">{history.length} registros</span>
        </div>
        {history.length ? (
          <div className="grid gap-3">
            {visible.map((item, i) => (
              <FadeIn key={item.id ?? `${item.url}-${i}`} delay={i * 0.04}>
                <PhishingResultCard result={item} />
              </FadeIn>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin análisis registrados"
            description="Analiza una URL para ver aquí el veredicto del modelo y de la lista de phishing."
          />
        )}
        {history.length ? <Pagination page={page} pageSize={PAGE_SIZE} total={history.length} onPage={setPage} /> : null}
      </section>
    </section>
  );
}
