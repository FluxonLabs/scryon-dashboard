"use client";

import Link from "next/link";
import { useCalls } from "@/hooks/useCalls";
import { useActions } from "@/hooks/useActions";
import { StatusBadge } from "@/components/StatusBadge";
import { CallActivityChart, CallStatusPieChart, CallHeatmap } from "@/components/charts/CallActivityChart";
import { useAuth } from "@/context/AuthContext";
import { Phone, CheckSquare, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "@/lib/date";

export default function DashboardPage() {
  const { user } = useAuth();
  const { items: calls, loading: callsLoading } = useCalls(50);
  const { items: actions, loading: actionsLoading } = useActions();

  const completed = calls.filter((c) => c.status === "COMPLETED");
  const pending = actions.filter((a) => a.status === "PENDING");
  const avgSentiment = null; // computed from analysis — requires per-call fetch, shown in Phase 3

  const recentCalls = calls.slice(0, 5);

  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Hello, {firstName} 👋
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Here's what's happening with your calls.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Phone}
          label="Total Calls"
          value={callsLoading ? "—" : String(calls.length)}
          color="brand"
        />
        <StatCard
          icon={CheckSquare}
          label="Transcribed"
          value={callsLoading ? "—" : String(completed.length)}
          color="positive"
        />
        <StatCard
          icon={TrendingUp}
          label="Open Actions"
          value={actionsLoading ? "—" : String(pending.length)}
          color="warning"
        />
        <StatCard
          icon={Clock}
          label="In Progress"
          value={callsLoading ? "—" : String(calls.filter((c) => c.status === "TRANSCRIBING" || c.status === "ANALYZING" || c.status === "QUEUED").length)}
          color="muted"
        />
      </div>

      {/* Charts row */}
      {!callsLoading && calls.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Call Activity — Last 14 Days
            </h2>
            <CallActivityChart calls={calls} />
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              By Status
            </h2>
            <CallStatusPieChart calls={calls} />
          </div>
        </div>
      )}

      {/* Heatmap */}
      {!callsLoading && calls.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-8">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Call History
          </h2>
          <CallHeatmap calls={calls} />
        </div>
      )}

      {/* Recent calls */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Recent Calls</h2>
          <Link
            href="/calls"
            className="text-xs text-[var(--brand-light)] hover:underline flex items-center gap-1"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {callsLoading ? (
          <SkeletonList rows={5} />
        ) : recentCalls.length === 0 ? (
          <EmptyState
            title="No calls yet"
            description="Open Scryon on your Android device to start transcribing calls."
          />
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            {recentCalls.map((call) => (
              <Link
                key={call.id}
                href={`/calls/${call.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--brand-dim)] flex items-center justify-center text-[var(--brand-light)] font-bold text-xs flex-shrink-0">
                  {(call.title ?? call.originalFileName ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">
                    {call.title ?? call.originalFileName ?? "Untitled call"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {call.durationSeconds ? formatDuration(call.durationSeconds) + " · " : ""}
                    {formatDistanceToNow(call.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={call.status} />
                  <ArrowRight size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pending action items */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Open Action Items</h2>
            <Link href="/actions" className="text-xs text-[var(--brand-light)] hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            {pending.slice(0, 4).map((action) => (
              <div key={action.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-4 h-4 rounded border border-[var(--brand)] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--foreground)] truncate">{action.title}</p>
                  {action.dueDate && (
                    <p className="text-xs text-[var(--text-muted)]">Due {action.dueDate}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: "brand" | "positive" | "warning" | "muted";
}) {
  const colors = {
    brand:    { bg: "bg-[var(--brand-dim)]",    icon: "text-[var(--brand-light)]",  val: "text-[var(--brand-light)]" },
    positive: { bg: "bg-[var(--positive-dim)]", icon: "text-[var(--positive)]",     val: "text-[var(--positive)]" },
    warning:  { bg: "bg-[var(--warning-dim)]",  icon: "text-[var(--warning)]",      val: "text-[var(--warning)]" },
    muted:    { bg: "bg-[var(--surface)]",       icon: "text-[var(--text-muted)]",  val: "text-[var(--text-secondary)]" },
  };
  const c = colors[color];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
        <Icon size={16} className={c.icon} />
      </div>
      <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1">{label}</p>
    </div>
  );
}

function SkeletonList({ rows }: { rows: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border-subtle)] overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-[var(--border)] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[var(--border)] rounded animate-pulse w-48" />
            <div className="h-2.5 bg-[var(--border)] rounded animate-pulse w-32" />
          </div>
          <div className="h-4 w-16 bg-[var(--border)] rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
      <p className="text-sm font-medium text-[var(--foreground)] mb-1">{title}</p>
      <p className="text-xs text-[var(--text-muted)]">{description}</p>
    </div>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
