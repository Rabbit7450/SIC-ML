import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "shimmer rounded-xl bg-background-elevated/80",
        className,
      )}
    />
  );
}
