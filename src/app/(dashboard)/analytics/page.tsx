"use client";

import { useMemo, useState } from "react";
import { Activity, AudioLines, CheckCircle2, Clock3, Users, UserRoundCheck } from "lucide-react";
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import { ActivityChart, DistributionChart, UserGrowthChart } from "@/components/charts/AdminAnalyticsCharts";

const ranges = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last year", days: 365 },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const dates = useMemo(() => dateRange(days), [days]);
  const { data, loading, error } = useAdminAnalytics(dates.from, dates.to);

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Company analytics</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Growth, adoption, and transcription health across Scryon.</p>
        </div>
        <select
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--brand)]"
        >
          {ranges.map((range) => <option key={range.days} value={range.days}>{range.label}</option>)}
        </select>
      </header>

      {error && <div className="rounded-xl border border-[var(--negative)] bg-[var(--negative-dim)] p-4 text-sm text-[var(--negative)] mb-6">{error}</div>}
      {loading && !data ? <AnalyticsSkeleton /> : data && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-6 gap-3 mb-6">
            <Metric icon={Users} label="Total users" value={data.overview.totalUsers} hint={`${data.overview.newUsers} new`} />
            <Metric icon={Activity} label="Active users" value={data.overview.activeUsers} hint="Uploaded in period" />
            <Metric icon={UserRoundCheck} label="Activated" value={data.overview.activatedUsers} hint="Completed a transcript" />
            <Metric icon={AudioLines} label="Transcriptions" value={data.overview.totalTranscriptions} hint={`${data.overview.completedTranscriptions} completed`} />
            <Metric icon={CheckCircle2} label="Completion rate" value={`${data.overview.completionRate}%`} hint={`${data.overview.failureRate}% failed`} />
            <Metric icon={Clock3} label="Audio processed" value={duration(data.overview.totalAudioSeconds)} hint="Selected period" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
            <ActivityChart data={data} />
            <UserGrowthChart data={data} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <DistributionChart title="Processing status" subtitle="All uploads in the selected period" values={data.callStatuses} />
            <DistributionChart title="Output languages" subtitle="Summary and analysis language" values={data.outputLanguages} />
            <DistributionChart title="Plans" subtitle="Current user plan distribution" values={data.plans} />
          </div>

          <p className="text-[10px] text-[var(--text-muted)] mt-4 text-right">
            UTC · {data.period.from} to {data.period.to} · transcript content is never read for these metrics
          </p>
        </>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: number | string; hint: string }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 min-w-0">
      <div className="w-8 h-8 rounded-lg bg-[var(--brand-dim)] text-[var(--brand-light)] grid place-content-center mb-3"><Icon size={16} /></div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] truncate">{label}</p>
      <p className="text-xl font-bold text-[var(--foreground)] mt-1 truncate">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-[10px] text-[var(--text-secondary)] mt-1 truncate">{hint}</p>
    </section>
  );
}

function AnalyticsSkeleton() {
  return <div className="space-y-4 animate-pulse"><div className="grid grid-cols-2 xl:grid-cols-6 gap-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-36 rounded-xl bg-[var(--surface)]" />)}</div><div className="grid grid-cols-1 xl:grid-cols-2 gap-4"><div className="h-80 rounded-xl bg-[var(--surface)]" /><div className="h-80 rounded-xl bg-[var(--surface)]" /></div></div>;
}

function dateRange(days: number) {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - days + 1);
  return { from: isoDate(from), to: isoDate(to) };
}

function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
function duration(seconds: number) {
  const hours = seconds / 3600;
  if (hours >= 1000) return `${(hours / 1000).toFixed(1)}k h`;
  if (hours >= 1) return `${hours.toFixed(hours >= 10 ? 0 : 1)} h`;
  return `${Math.round(seconds / 60)} min`;
}
