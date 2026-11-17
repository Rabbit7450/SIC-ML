import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  describeSignals,
  sourceLabel,
  verdictClass,
  verdictLabel,
  type PhishingHistoryItem,
} from "@/lib/phishing";

export function PhishingResultCard({ result }: { result: PhishingHistoryItem }) {
  const signals = describeSignals(result.features);
  const pct = result.score === null ? null : Math.round(result.score * 100);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 break-all font-mono text-sm">{result.url}</p>
        <Badge className={verdictClass[result.verdict]}>
          {verdictLabel[result.verdict]}
          {pct !== null && ` · ${pct}%`}
        </Badge>
      </div>

      <p className="mt-2 text-xs text-muted">
        Fuente: {sourceLabel[result.source]}
        {result.blocklist_match && ` (${result.blocklist_match})`}
        {result.source === "blocklist" && result.model_score !== null
          ? ` · modelo: ${Math.round(result.model_score * 100)}%`
          : ""}
        {result.created_at ? ` · ${new Date(result.created_at).toLocaleString("es-BO")}` : " · sesión actual"}
      </p>

      {signals.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {signals.map((s) => (
            <Badge key={s} className="border-border bg-background-elevated normal-case">
              {s}
            </Badge>
          ))}
        </div>
      )}

      {result.notes.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted">
          {result.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
