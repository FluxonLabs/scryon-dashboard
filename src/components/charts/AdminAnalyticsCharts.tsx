"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { AdminAnalytics } from "@/types";

const COLORS = ["var(--brand)", "var(--positive)", "var(--warning)", "var(--negative)", "#8b5cf6", "#06b6d4"];
const tooltipStyle = {
  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 11,
};

export function ActivityChart({ data }: { data: AdminAnalytics }) {
  const points = data.activity.map((point) => ({
    ...point,
    label: new Date(`${point.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));
  return (
    <ChartCard title="Transcription activity" subtitle="Uploads and successful transcriptions">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={points} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="analyticsUploads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Area type="monotone" dataKey="transcriptions" name="Uploads" stroke="var(--brand)" strokeWidth={2} fill="url(#analyticsUploads)" />
          <Area type="monotone" dataKey="completedTranscriptions" name="Completed" stroke="var(--positive)" strokeWidth={2} fillOpacity={0} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function UserGrowthChart({ data }: { data: AdminAnalytics }) {
  const points = data.activity.map((point) => ({
    ...point,
    label: new Date(`${point.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));
  return (
    <ChartCard title="Users" subtitle="New and active transcribing users">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={points} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar dataKey="newUsers" name="New users" fill="var(--brand)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="activeUsers" name="Active users" fill="var(--positive)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DistributionChart({ title, subtitle, values }: {
  title: string; subtitle: string; values: Record<string, number>;
}) {
  const entries = Object.entries(values).filter(([, value]) => value > 0).map(([name, value]) => ({ name: readable(name), value }));
  const total = entries.reduce((sum, item) => sum + item.value, 0);
  return (
    <ChartCard title={title} subtitle={subtitle}>
      {total === 0 ? <Empty /> : (
        <div className="flex items-center gap-5 h-[210px]">
          <div className="relative w-[150px] h-[150px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={entries} dataKey="value" nameKey="name" innerRadius={43} outerRadius={68} strokeWidth={0}>
                  {entries.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-content-center text-center pointer-events-none">
              <strong className="text-xl text-[var(--foreground)]">{total.toLocaleString()}</strong>
              <span className="text-[9px] text-[var(--text-muted)]">total</span>
            </div>
          </div>
          <div className="space-y-2 flex-1 min-w-0">
            {entries.slice(0, 6).map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                <span className="text-[var(--text-secondary)] truncate">{entry.name}</span>
                <span className="ml-auto font-medium text-[var(--foreground)]">{entry.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 mb-4">{subtitle}</p>
      {children}
    </section>
  );
}

function Empty() { return <div className="h-[210px] grid place-content-center text-xs text-[var(--text-muted)]">No activity in this period</div>; }
function readable(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
