import { Topbar } from "@/components/layout/topbar";
import { FadeIn } from "@/components/animations/fade-in";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { demoModels } from "@/lib/demo-data";

export default async function ModelsPage() {
  let models = demoModels;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("models")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (data?.length) models = data as typeof demoModels;
  } catch {
    /* demo */
  }

  return (
    <>
      <Topbar
        title="Modelos ML"
        subtitle="Versiones, métricas y estado de despliegue"
      />
      <div className="grid gap-4 p-6 md:grid-cols-2">
        {models.map((model, i) => (
          <FadeIn key={model.id} delay={i * 0.06}>
            <Card glow={model.is_deployed}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl">{model.name}</p>
                  <p className="mt-1 font-mono text-xs text-muted">
                    v{model.version} · {model.algorithm}
                  </p>
                </div>
                <Badge
                  className={
                    model.is_deployed
                      ? "border-secondary/40 bg-secondary/15 text-secondary"
                      : "border-border bg-background-elevated text-muted"
                  }
                >
                  {model.is_deployed ? "activo" : "inactivo"}
                </Badge>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-background-elevated/70 p-3">
                  <dt className="text-xs text-muted">F1</dt>
                  <dd className="font-display text-2xl text-primary">
                    {model.metrics?.f1?.toFixed(4) ?? "—"}
                  </dd>
                </div>
                <div className="rounded-xl bg-background-elevated/70 p-3">
                  <dt className="text-xs text-muted">Accuracy</dt>
                  <dd className="font-display text-2xl text-secondary">
                    {model.metrics?.accuracy?.toFixed(4) ?? "—"}
                  </dd>
                </div>
              </dl>
            </Card>
          </FadeIn>
        ))}
      </div>
    </>
  );
}
