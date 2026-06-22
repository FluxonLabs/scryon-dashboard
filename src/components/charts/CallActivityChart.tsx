"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import type { CallSummary, ActionItem } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

// ─── Call Activity bar chart with time filter ─────────────────────────────────

type Range = "7d" | "30d" | "90d";

const RANGES: { label: string; value: Range }[] = [
  { label: "7 days",  value: "7d"  },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

export function CallActivityChart({ calls }: { calls: CallSummary[] }) {
  const [range, setRange] = useState<Range>("30d");

  const data = buildActivityData(calls, range);
  const isWeekly = range === "90d";
  const tickFormatter = isWeekly
    ? (v: string) => v.slice(5)           // "MM-DD"
    : (v: string) => v.slice(5);          // "MM-DD" for daily too

  // Show every other tick for 30d to avoid crowding
  const tickInterval = range === "7d" ? 0 : range === "30d" ? 2 : 1;

  return (
    <div>
      {/* Filter pills */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Call Activity
        </h2>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition-colors ${
                range === r.value
                  ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                  : "bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand)] hover:text-[var(--foreground)]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ left: -16, right: 4, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "var(--text-muted)" }}
            tickFormatter={tickFormatter}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
          />
          <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            formatter={(v) => [v, isWeekly ? "Calls (week)" : "Calls"]}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "var(--text-secondary)" }}
          />
          <Bar dataKey="count" fill="var(--brand)" radius={[3, 3, 0, 0]} maxBarSize={isWeekly ? 28 : 18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function buildActivityData(calls: CallSummary[], range: Range) {
  const now = Date.now();

  if (range === "90d") {
    // Weekly buckets: 13 weeks
    const buckets: Record<string, number> = {};
    for (let w = 12; w >= 0; w--) {
      const weekStart = startOfWeek(new Date(now - w * 7 * 86400000));
      buckets[isoDate(weekStart)] = 0;
    }
    calls.forEach((c) => {
      const ws = isoDate(startOfWeek(new Date(c.createdAt)));
      if (ws in buckets) buckets[ws]++;
    });
    return Object.entries(buckets).map(([label, count]) => ({ label, count }));
  }

  // Daily buckets for 7d / 30d
  const days = range === "7d" ? 7 : 30;
  const buckets: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    buckets[isoDate(new Date(now - i * 86400000))] = 0;
  }
  calls.forEach((c) => {
    const key = c.createdAt.slice(0, 10);
    if (key in buckets) buckets[key]++;
  });
  return Object.entries(buckets).map(([label, count]) => ({ label, count }));
}

// ─── Action Items donut chart ─────────────────────────────────────────────────

const ACTION_STATUS_CONFIG = [
  { key: "OPEN",        label: "Open",        color: "var(--brand)"    },
  { key: "IN_PROGRESS", label: "In Progress", color: "var(--warning)"  },
  { key: "DONE",        label: "Done",        color: "var(--positive)" },
  { key: "DISMISSED",   label: "Dismissed",   color: "var(--text-muted)" },
] as const;

export function ActionItemsChart({ items }: { items: ActionItem[] }) {
  const counts = items.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  const data = ACTION_STATUS_CONFIG
    .map(({ key, label, color }) => ({ name: label, value: counts[key] ?? 0, color }))
    .filter((d) => d.value > 0);

  const total = items.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-center">
        <p className="text-xs text-[var(--text-muted)]">No action items yet</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Action Items
      </h2>
      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={50}
                dataKey="value"
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, name) => [v, name]}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-[var(--foreground)]">{total}</span>
            <span className="text-[9px] text-[var(--text-muted)]">total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 min-w-0">
          {ACTION_STATUS_CONFIG.map(({ key, label, color }) => {
            const count = counts[key] ?? 0;
            if (count === 0) return null;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-[10px] text-[var(--text-secondary)] truncate">{label}</span>
                <span className="text-[10px] font-semibold text-[var(--foreground)] ml-auto pl-2">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
