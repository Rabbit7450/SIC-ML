"use client";

import { FormEvent, useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { FadeIn } from "@/components/animations/fade-in";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Result = {
  url: string;
  label: "legit" | "phish";
  score: number;
  features: Record<string, number>;
};

function analyzeUrl(url: string): Result {
  const lower = url.toLowerCase();
  const features = {
    length: url.length,
    https: lower.startsWith("https") ? 1 : 0,
    suspicious_tld: /\.(xyz|tk|ml|gq|top|work)(\/|$)/.test(lower) ? 1 : 0,
    at_symbol: url.includes("@") ? 1 : 0,
    ip_host: /\d+\.\d+\.\d+\.\d+/.test(url) ? 1 : 0,
  };
  const risk =
    (1 - features.https) * 0.25 +
    features.suspicious_tld * 0.35 +
    features.at_symbol * 0.2 +
    features.ip_host * 0.25 +
    (features.length > 60 ? 0.15 : 0);
  const score = Math.min(0.99, risk);
  return {
    url,
    label: score >= 0.45 ? "phish" : "legit",
    score,
    features,
  };
}

export default function PhishingPage() {
  const [url, setUrl] = useState("");
  const [history, setHistory] = useState<Result[]>([]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = analyzeUrl(url);
    setHistory((h) => [result, ...h].slice(0, 12));
  }

  return (
    <>
      <Topbar
        title="Phishing / Auditoría"
        subtitle="Análisis léxico de URL en el cliente (demo) + historial"
      />
      <div className="space-y-6 p-6">
        <FadeIn>
          <Card glow>
            <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="https://ejemplo.com o URL sospechosa"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <Button type="submit">Analizar</Button>
            </form>
          </Card>
        </FadeIn>

        <div className="grid gap-3">
          {history.map((item, i) => (
            <FadeIn key={`${item.url}-${i}`} delay={i * 0.04}>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="break-all font-mono text-sm">{item.url}</p>
                  <Badge
                    className={
                      item.label === "phish"
                        ? "border-accent/40 bg-accent/15 text-accent"
                        : "border-secondary/40 bg-secondary/15 text-secondary"
                    }
                  >
                    {item.label} · {(item.score * 100).toFixed(0)}%
                  </Badge>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </>
  );
}
