import { TreePine } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <TreePine className="h-7 w-7" />
      </div>
      <h3 className="font-display text-lg">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{description}</p>
    </div>
  );
}
