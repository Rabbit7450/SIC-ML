import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  glow,
}: {
  className?: string;
  children: React.ReactNode;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-card p-5 shadow-sm",
        glow && "surface-emphasis",
        className,
      )}
    >
      {children}
    </div>
  );
}
