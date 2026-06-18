"use client";

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, LineChart, Line,
  ReferenceLine,
} from "recharts";
import type { Sentiment, SentimentMoment } from "@/types";

// ─── Sentiment comparison bars ────────────────────────────────────────────────

interface SentimentBarProps {
  sentiment: Sentiment;
}

export function SentimentComparisonChart({ sentiment }: SentimentBarProps) {
  const data = [
    { name: "Overall", score: sentiment.score ?? 0 },
    ...(sentiment.userSentiment?.score != null
      ? [{ name: "You", score: sentiment.userSentiment.score }]
      : []),
    ...(sentiment.contactSentiment?.score != null
      ? [{ name: "Contact", score: sentiment.contactSentiment.score }]
      : []),
  ];

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" domain={[-1, 1]} tickCount={5} tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} width={52} />
        <ReferenceLine x={0} stroke="var(--border)" />
        <Tooltip
          formatter={(v) => { const n = Number(v); return [n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2), "Score"]; }}
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--foreground)" }}
        />
        <Bar dataKey="score" radius={4} maxBarSize={20}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.score > 0.2
                  ? "var(--positive)"
                  : entry.score < -0.2
                  ? "var(--negative)"
                  : "var(--text-muted)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Sentiment progression line ───────────────────────────────────────────────

interface SentimentProgressionProps {
  progression: SentimentMoment[];
}

export function SentimentProgressionChart({ progression }: SentimentProgressionProps) {
  const data = progression.map((p) => ({
    phase: p.phase.charAt(0).toUpperCase() + p.phase.slice(1),
    note: p.note,
    value: p.overall === "positive" ? 0.7 : p.overall === "negative" ? -0.7 : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="phase" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
        <YAxis domain={[-1, 1]} hide />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Tooltip
          formatter={(_: unknown, __: unknown, props: { payload?: { note?: string } }) => [props.payload?.note ?? "", "Mood"]}
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--foreground)" }}
        />
        <Line type="monotone" dataKey="value" stroke="var(--brand)" strokeWidth={2} dot={{ fill: "var(--brand)", r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Tone radar ───────────────────────────────────────────────────────────────

const FORMALITY_MAP: Record<string, number> = { formal: 90, professional: 75, neutral: 55, casual: 35, informal: 20 };
const ENERGY_MAP: Record<string, number> = { high: 90, energetic: 85, moderate: 55, calm: 35, low: 20 };
const PACE_MAP: Record<string, number> = { fast: 90, brisk: 75, moderate: 55, slow: 30, deliberate: 40 };

interface ToneRadarProps {
  formality: string;
  energy: string;
  pace: string;
  overall: string;
}

export function ToneRadarChart({ formality, energy, pace, overall }: ToneRadarProps) {
  const data = [
    { attr: "Formality", value: FORMALITY_MAP[formality.toLowerCase()] ?? 50 },
    { attr: "Energy",    value: ENERGY_MAP[energy.toLowerCase()]    ?? 50 },
    { attr: "Pace",      value: PACE_MAP[pace.toLowerCase()]         ?? 50 },
  ];

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={160} height={140}>
        <RadarChart cx="50%" cy="50%" outerRadius={55} data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="attr" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
          <Radar dataKey="value" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.25} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="space-y-2 text-sm">
        {data.map((d) => (
          <div key={d.attr} className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)] w-16">{d.attr}</span>
            <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] w-24">
              <div
                className="h-full rounded-full bg-[var(--brand)]"
                style={{ width: `${d.value}%` }}
              />
            </div>
            <span className="text-xs text-[var(--text-secondary)] w-20 capitalize">
              {d.attr === "Formality" ? formality : d.attr === "Energy" ? energy : pace}
            </span>
          </div>
        ))}
        <p className="text-xs text-[var(--text-muted)] pt-1">
          Overall: <span className="text-[var(--foreground)] capitalize">{overall}</span>
        </p>
      </div>
    </div>
  );
}
