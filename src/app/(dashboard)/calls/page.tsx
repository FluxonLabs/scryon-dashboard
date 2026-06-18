"use client";

import Link from "next/link";
import { useCalls } from "@/hooks/useCalls";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDistanceToNow, formatDuration } from "@/lib/date";
import { Phone, ArrowRight, RefreshCw } from "lucide-react";
import type { CallStatus } from "@/types";
import { useState } from "react";

const STATUS_FILTERS: { label: string; value: CallStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Processing", value: "TRANSCRIBING" },
  { label: "Failed", value: "FAILED" },
];

export default function CallsPage() {
  const { items, loading, error, hasMore, loadMore, refresh } = useCalls(30);
  const [filter, setFilter] = useState<CallStatus | "ALL">("ALL");

  const filtered = filter === "ALL" ? items : items.filter((c) => c.status === filter);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Calls</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {loading ? "Loading…" : `${items.length} total`}
          </p>
        </div>
        <button
          onClick={refresh}
          className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:border-[var(--brand)] transition-colors"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              filter === f.value
                ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--foreground)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--negative-dim)] border border-[var(--negative)]/20 px-4 py-3 text-sm text-[var(--negative)] mb-4">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <CallListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <Phone size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">No calls found</p>
          <p className="text-xs text-[var(--text-muted)]">
            {filter !== "ALL" ? "Try changing the filter." : "Record a call in the Scryon app to get started."}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            {filtered.map((call) => (
              <Link
                key={call.id}
                href={`/calls/${call.id}`}
                className="flex items-center gap-4 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors group"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--brand-dim)] flex items-center justify-center text-[var(--brand-light)] font-bold text-sm flex-shrink-0">
                  {(call.title ?? call.originalFileName ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                    {call.title ?? call.originalFileName ?? "Untitled call"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {call.shortSummary && (
                      <span className="text-xs text-[var(--text-muted)] truncate max-w-xs">{call.shortSummary}</span>
                    )}
                    {call.durationSeconds && (
                      <span className="text-xs text-[var(--text-muted)]">{formatDuration(call.durationSeconds)}</span>
                    )}
                    <span className="text-xs text-[var(--text-muted)]">{formatDistanceToNow(call.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={call.status} />
                  <ArrowRight size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="mt-4 w-full py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function CallListSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border-subtle)] overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <div className="w-9 h-9 rounded-full bg-[var(--border)] animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-[var(--border)] rounded animate-pulse w-56" />
            <div className="h-2.5 bg-[var(--border)] rounded animate-pulse w-36" />
          </div>
          <div className="h-4 w-20 bg-[var(--border)] rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
