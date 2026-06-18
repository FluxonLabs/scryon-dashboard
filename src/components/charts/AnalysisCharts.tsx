"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { DiscussionPoint, AnalysisActionItem } from "@/types";

const PHASE_COLORS: Record<string, string> = {
  opening:  "var(--brand)",
  middle:   "var(--positive)",
  closing:  "var(--warning)",
  followup: "var(--text-secondary)",
};

const INTENT_COLORS: Record<string, string> = {
  meeting:  "var(--brand)",
  email:    "var(--positive)",
  call:     "var(--warning)",
  message:  "var(--brand-light)",
  reminder: "var(--text-secondary)",
  task:     "var(--negative)",
  none:     "var(--border)",
};

// ─── Discussion points by phase ───────────────────────────────────────────────

interface DiscussionPieProps {
  points: DiscussionPoint[];
}

export function DiscussionPhaseChart({ points }: DiscussionPieProps) {
  const counts = points.reduce<Record<string, number>>((acc, p) => {
    acc[p.phase] = (acc[p.phase] ?? 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([phase, count]) => ({
    name: phase.charAt(0).toUpperCase() + phase.slice(1),
    value: count,
    phase,
  }));

  if (data.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Discussion by Phase
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="40%"
            cy="50%"
            innerRadius={45}
            outerRadius={72}
            dataKey="value"
            paddingAngle={3}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={PHASE_COLORS[entry.phase] ?? "var(--text-muted)"} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number, name: string) => [v, name]}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          />
          <Legend
            iconSize={8}
            iconType="circle"
            formatter={(value) => <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Action items by intent ───────────────────────────────────────────────────

interface ActionIntentPieProps {
  actions: AnalysisActionItem[];
}

export function ActionIntentChart({ actions }: ActionIntentPieProps) {
  const counts = actions.reduce<Record<string, number>>((acc, a) => {
    const key = a.intent ?? "none";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts)
    .filter(([k]) => k !== "none")
    .map(([intent, count]) => ({
      name: intent.charAt(0).toUpperCase() + intent.slice(1),
      value: count,
      intent,
    }));

  if (data.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Actions by Intent
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="40%"
            cy="50%"
            innerRadius={45}
            outerRadius={72}
            dataKey="value"
            paddingAngle={3}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={INTENT_COLORS[entry.intent] ?? "var(--text-muted)"} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number, name: string) => [v, name]}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          />
          <Legend
            iconSize={8}
            iconType="circle"
            formatter={(value) => <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
