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
        "grain relative rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm transition hover:border-primary/30",
        glow && "glow-amber hover:shadow-[0_0_32px_rgba(245,158,11,0.28)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
