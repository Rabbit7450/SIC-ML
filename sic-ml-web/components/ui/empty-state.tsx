import { TreePine, type LucideIcon } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon = TreePine,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="font-display text-lg text-balance">{title}</h3>
      <p className="max-w-sm text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}
