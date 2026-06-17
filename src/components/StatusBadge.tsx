import { cn } from "@/lib/utils";
import type { CallStatus } from "@/types";

const MAP: Record<CallStatus, { label: string; className: string }> = {
  QUEUED:      { label: "Queued",      className: "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]" },
  TRANSCRIBING:{ label: "Transcribing",className: "bg-[var(--brand-dim)] text-[var(--brand-light)] border-[var(--brand)]" },
  ANALYZING:   { label: "Analyzing",  className: "bg-[var(--warning-dim)] text-[var(--warning)] border-[var(--warning)]" },
  COMPLETED:   { label: "Completed",  className: "bg-[var(--positive-dim)] text-[var(--positive)] border-[var(--positive)]" },
  FAILED:      { label: "Failed",     className: "bg-[var(--negative-dim)] text-[var(--negative)] border-[var(--negative)]" },
};

export function StatusBadge({ status }: { status: CallStatus }) {
  const { label, className } = MAP[status] ?? MAP.FAILED;
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded border", className)}>
      {label}
    </span>
  );
}

export function SentimentBadge({ score, overall }: { score: number | null; overall: string }) {
  if (score === null) return null;
  const color =
    score > 0.2 ? "text-[var(--positive)]" :
    score < -0.2 ? "text-[var(--negative)]" :
    "text-[var(--text-secondary)]";
  return (
    <span className={cn("text-xs font-semibold", color)}>
      {score > 0 ? "+" : ""}{score.toFixed(2)} · {overall}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: "low" | "medium" | "high" }) {
  const color =
    priority === "high" ? "bg-[var(--negative)]" :
    priority === "medium" ? "bg-[var(--warning)]" :
    "bg-[var(--text-muted)]";
  return <span className={cn("inline-block w-1.5 h-1.5 rounded-full", color)} />;
}
