"use client";

import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import type { VibeAnalytics } from "@/hooks/useVibeAnalytics";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const SENTIMENT_META: Record<string, { label: string; color: string }> = {
  positive: { label: "Positive", color: "var(--positive)" },
  negative: { label: "Negative", color: "var(--negative)" },
  mixed:    { label: "Mixed",    color: "var(--warning)"  },
  neutral:  { label: "Neutral",  color: "var(--text-muted)" },
  unclear:  { label: "Unclear",  color: "var(--border)"   },
  unknown:  { label: "Unknown",  color: "var(--border)"   },
};

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }

// ─── Sentiment Donut ─────────────────────────────────────────────────────────

export function SentimentDistributionChart({ data }: { data: VibeAnalytics }) {
  const [party, setParty] = useState<"overall" | "you" | "contact">("overall");

  const raw =
    party === "overall" ? data.sentimentDistribution
    : party === "you"   ? data.userSentimentDistribution
    :                     data.contactSentimentDistribution;

  const entries = Object.entries(raw).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const chartData = entries.map(([k, v]) => ({
    name: SENTIMENT_META[k]?.label ?? cap(k),
    value: v,
    color: SENTIMENT_META[k]?.color ?? "var(--text-muted)",
  }));

  const TABS = [
    { key: "overall" as const, label: "Overall" },
    { key: "you"     as const, label: "You"     },
    { key: "contact" as const, label: "Contact" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Sentiment Split</h2>
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setParty(t.key)}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition-colors ${
                party === t.key
                  ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                  : "bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">No data yet</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative w-28 h-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" strokeWidth={0}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-[var(--foreground)]">{total}</span>
              <span className="text-[9px] text-[var(--text-muted)]">calls</span>
            </div>
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            {chartData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-[10px] text-[var(--text-secondary)] truncate">{d.name}</span>
                <span className="text-[10px] font-semibold text-[var(--foreground)] ml-auto pl-2">
                  {d.value} <span className="font-normal text-[var(--text-muted)]">({Math.round((d.value / total) * 100)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sentiment Trend Line ─────────────────────────────────────────────────────

const SENTIMENTS_TO_SHOW = ["positive", "negative", "mixed"];

export function SentimentTrendChart({ data }: { data: VibeAnalytics }) {
  const chartData = data.sentimentTrend.map((p) => ({
    week: p.week.slice(5), // "MM-DD"
    ...Object.fromEntries(
      SENTIMENTS_TO_SHOW.map((s) => [s, p.counts[s] ?? 0])
    ),
  }));

  if (chartData.length === 0) {
    return (
      <div>
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Sentiment Over Time</h2>
        <p className="text-xs text-[var(--text-muted)]">Not enough data yet</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Sentiment Over Time</h2>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
          {SENTIMENTS_TO_SHOW.map((s) => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              name={cap(s)}
              stroke={SENTIMENT_META[s]?.color ?? "var(--text-muted)"}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
          <Legend
            iconType="circle"
            iconSize={6}
            wrapperStyle={{ fontSize: 10, color: "var(--text-secondary)", paddingTop: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Tone Profile Bars ────────────────────────────────────────────────────────

const TONE_DIMS: { key: keyof VibeAnalytics["toneProfile"]; label: string }[] = [
  { key: "formality", label: "Formality" },
  { key: "energy",    label: "Energy"    },
  { key: "pace",      label: "Pace"      },
];

export function ToneProfileChart({ data }: { data: VibeAnalytics }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Tone Profile</h2>
      <div className="space-y-4">
        {TONE_DIMS.map(({ key, label }) => {
          const raw = data.toneProfile[key];
          const entries = Object.entries(raw).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
          const total = entries.reduce((s, [, v]) => s + v, 0);
          if (total === 0) return null;
          return (
            <div key={key}>
              <p className="text-[10px] font-medium text-[var(--text-secondary)] mb-1.5">{label}</p>
              <div className="space-y-1">
                {entries.map(([k, v]) => {
                  const pct = Math.round((v / total) * 100);
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-[9px] text-[var(--text-muted)] w-20 shrink-0 capitalize">{k.replace(/-/g, " ")}</span>
                      <div className="flex-1 h-1.5 bg-[var(--surface-2,var(--border))] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--brand)] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-[var(--text-muted)] w-6 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
