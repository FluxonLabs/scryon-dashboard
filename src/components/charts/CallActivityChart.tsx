"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import type { CallSummary } from "@/types";

// ─── Calls per day bar chart (last 30 days) ───────────────────────────────────

interface ActivityProps {
  calls: CallSummary[];
}

export function CallActivityChart({ calls }: ActivityProps) {
  const buckets: Record<string, number> = {};
  const now = Date.now();
  // initialise last 14 days
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    buckets[shortDate(d)] = 0;
  }
  calls.forEach((c) => {
    const d = new Date(c.createdAt);
    const key = shortDate(d);
    if (key in buckets) buckets[key]++;
  });

  const data = Object.entries(buckets).map(([date, count]) => ({ date, count }));

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ left: -16, right: 4, top: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 9, fill: "var(--text-muted)" }}
          tickFormatter={(v) => v.slice(5)}
          axisLine={false}
          tickLine={false}
          interval={1}
        />
        <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          formatter={(v) => [v, "Calls"]}
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--text-secondary)" }}
        />
        <Bar dataKey="count" fill="var(--brand)" radius={[3, 3, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Call status pie ──────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  COMPLETED:   "#4ade80",
  FAILED:      "#f87171",
  TRANSCRIBING:"#6366f1",
  ANALYZING:   "#fb923c",
  QUEUED:      "#94a3b8",
};

export function CallStatusPieChart({ calls }: ActivityProps) {
  const counts = calls.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([status, count]) => ({ name: status, value: count }));
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} cx="40%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3}>
          {data.map((entry, i) => (
            <Cell key={i} fill={STATUS_COLORS[entry.name] ?? "var(--text-muted)"} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, name) => [v, name]}
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
        />
        <Legend
          iconSize={8}
          iconType="circle"
          formatter={(value) => <span style={{ color: "var(--text-secondary)", fontSize: 10 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Activity heatmap (GitHub-style, last 12 weeks) ──────────────────────────

export function CallHeatmap({ calls }: ActivityProps) {
  const counts: Record<string, number> = {};
  calls.forEach((c) => {
    const key = c.createdAt.slice(0, 10);
    counts[key] = (counts[key] ?? 0) + 1;
  });

  const max = Math.max(1, ...Object.values(counts));
  const weeks: { date: string; count: number }[][] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  // start from Sunday of 11 weeks ago
  const startDay = new Date(now);
  startDay.setDate(startDay.getDate() - startDay.getDay() - 77);

  let week: { date: string; count: number }[] = [];
  const cursor = new Date(startDay);
  while (cursor <= now) {
    const key = cursor.toISOString().slice(0, 10);
    week.push({ date: key, count: counts[key] ?? 0 });
    if (cursor.getDay() === 6) {
      weeks.push(week);
      week = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (week.length) weeks.push(week);

  function intensity(count: number) {
    if (count === 0) return "bg-[var(--surface-2)] border border-[var(--border)]";
    const ratio = count / max;
    if (ratio < 0.25) return "bg-[var(--brand)]/30";
    if (ratio < 0.5)  return "bg-[var(--brand)]/55";
    if (ratio < 0.75) return "bg-[var(--brand)]/80";
    return "bg-[var(--brand)]";
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} call${day.count !== 1 ? "s" : ""}`}
                className={`w-3 h-3 rounded-sm ${intensity(day.count)} cursor-default`}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[var(--text-muted)] mt-2">Last 12 weeks</p>
    </div>
  );
}

function shortDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
