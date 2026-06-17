"use client";

import Link from "next/link";
import { useActions } from "@/hooks/useActions";
import { cn } from "@/lib/utils";
import { CheckSquare, ArrowRight } from "lucide-react";
import { useState } from "react";

type View = "pending" | "completed" | "all";

export default function ActionsPage() {
  const { items, loading, error, toggle } = useActions();
  const [view, setView] = useState<View>("pending");

  const pending = items.filter((a) => a.status === "PENDING");
  const completed = items.filter((a) => a.status === "COMPLETED");
  const shown = view === "pending" ? pending : view === "completed" ? completed : items;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Action Items</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {loading ? "Loading…" : `${pending.length} open · ${completed.length} done`}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["pending", "completed", "all"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors capitalize",
              view === v
                ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]"
            )}
          >
            {v === "pending" ? `Open (${pending.length})` : v === "completed" ? `Done (${completed.length})` : `All (${items.length})`}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--negative-dim)] border border-[var(--negative)]/20 px-4 py-3 text-sm text-[var(--negative)] mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <ActionsSkeleton />
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <CheckSquare size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">
            {view === "pending" ? "All caught up!" : "No completed actions yet"}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {view === "pending"
              ? "Action items from your calls will appear here."
              : "Mark items done to see them here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((action) => (
            <div
              key={action.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border transition-colors",
                action.status === "COMPLETED"
                  ? "border-[var(--border-subtle)] bg-[var(--surface)] opacity-60"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-subtle)]"
              )}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggle(action.id, action.status)}
                className={cn(
                  "w-5 h-5 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                  action.status === "COMPLETED"
                    ? "bg-[var(--positive)] border-[var(--positive)]"
                    : "border-[var(--border)] hover:border-[var(--brand)]"
                )}
              >
                {action.status === "COMPLETED" && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  action.status === "COMPLETED" ? "line-through text-[var(--text-muted)]" : "text-[var(--foreground)]"
                )}>
                  {action.title}
                </p>
                {action.description && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{action.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {action.dueDate && (
                    <span className={cn(
                      "text-xs",
                      isOverdue(action.dueDate) && action.status === "PENDING"
                        ? "text-[var(--negative)] font-medium"
                        : "text-[var(--text-muted)]"
                    )}>
                      {isOverdue(action.dueDate) && action.status === "PENDING" ? "Overdue · " : "Due "}{action.dueDate}
                    </span>
                  )}
                  {action.intent && action.intent !== "none" && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-muted)] capitalize">
                      {action.intent}
                    </span>
                  )}
                </div>
              </div>

              {/* Link to call */}
              <Link
                href={`/calls/${action.callRecordId}`}
                className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--brand-light)] hover:bg-[var(--brand-dim)] transition-colors flex-shrink-0"
                title="View call"
              >
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function ActionsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="w-5 h-5 rounded border border-[var(--border)] animate-pulse flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-[var(--border)] rounded animate-pulse w-64" />
            <div className="h-2.5 bg-[var(--border)] rounded animate-pulse w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}
