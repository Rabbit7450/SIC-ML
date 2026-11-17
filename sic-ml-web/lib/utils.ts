import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function severityClass(severity: string) {
  switch (severity) {
    case "critica":
      return "bg-accent/20 text-accent border-accent/40";
    case "alta":
      return "bg-primary/20 text-primary border-primary/40";
    case "media":
      return "bg-warning/15 text-warning border-warning/30";
    default:
      return "bg-secondary/15 text-secondary border-secondary/30";
  }
}
