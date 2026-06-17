"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useCall } from "@/hooks/useCall";
import { useTranscript } from "@/hooks/useTranscript";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useActions } from "@/hooks/useActions";
import { StatusBadge, SentimentBadge, PriorityDot } from "@/components/StatusBadge";
import { formatDate, formatDuration } from "@/lib/date";
import { cn } from "@/lib/utils";
import { ArrowLeft, AlertCircle } from "lucide-react";
import type { SpeakerRole } from "@/types";

type Tab = "transcript" | "analysis" | "actions";

export default function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>("transcript");
  const { call, loading: callLoading } = useCall(id);
  const { transcript, loading: txLoading } = useTranscript(id);
  const { analysis, loading: anLoading } = useAnalysis(id);
  const { items: allActions, toggle } = useActions();

  const callActions = allActions.filter((a) => a.callRecordId === id);
  const isCompleted = call?.status === "COMPLETED";

  if (callLoading) return <PageSkeleton />;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)] shrink-0">
        <Link
          href="/calls"
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-[var(--foreground)] truncate">
            {call?.title ?? call?.contactName ?? "Untitled call"}
          </h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {call?.contactName && call?.title && (
              <span className="text-xs text-[var(--text-muted)]">{call.contactName}</span>
            )}
            {call?.durationSeconds && (
              <span className="text-xs text-[var(--text-muted)]">{formatDuration(call.durationSeconds)}</span>
            )}
            {call?.recordedAt && (
              <span className="text-xs text-[var(--text-muted)]">{formatDate(call.recordedAt)}</span>
            )}
            {call?.status && <StatusBadge status={call.status} />}
          </div>
        </div>
        {analysis?.sentiment && (
          <SentimentBadge score={analysis.sentiment.score} overall={analysis.sentiment.overall} />
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 pb-0 border-b border-[var(--border)] shrink-0">
        {(["transcript", "analysis", "actions"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
              tab === t
                ? "border-[var(--brand)] text-[var(--brand-light)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--foreground)]"
            )}
          >
            {t}
            {t === "actions" && callActions.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-[var(--brand-dim)] text-[var(--brand-light)] rounded px-1">
                {callActions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "transcript" && (
          <TranscriptTab loading={txLoading} transcript={transcript} isCompleted={isCompleted} />
        )}
        {tab === "analysis" && (
          <AnalysisTab loading={anLoading} analysis={analysis} isCompleted={isCompleted} />
        )}
        {tab === "actions" && (
          <ActionsTab actions={callActions} onToggle={toggle} />
        )}
      </div>
    </div>
  );
}

// ─── Transcript Tab ───────────────────────────────────────────────────────────

function TranscriptTab({ loading, transcript, isCompleted }: {
  loading: boolean;
  transcript: ReturnType<typeof useTranscript>["transcript"];
  isCompleted: boolean;
}) {
  if (!isCompleted) return <NotReady message="Transcript not available yet — call is still processing." />;
  if (loading) return <TranscriptSkeleton />;
  if (!transcript) return <NotReady message="Transcript unavailable." />;

  return (
    <div className="max-w-2xl space-y-1">
      {transcript.segments.map((seg) => (
        <div key={seg.id} className="group flex gap-3 py-2 rounded-lg px-2 hover:bg-[var(--surface)] transition-colors">
          <span className="text-[10px] text-[var(--text-muted)] mt-1 w-10 shrink-0 text-right font-mono">
            {formatSeconds(seg.startSeconds)}
          </span>
          <div>
            <span className={cn("text-xs font-bold mr-2", speakerColor(seg.role))}>
              {seg.speakerDisplayName || seg.speakerLabel}
            </span>
            <span className="text-sm text-[var(--text-secondary)] leading-relaxed">{seg.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Analysis Tab ─────────────────────────────────────────────────────────────

function AnalysisTab({ loading, analysis, isCompleted }: {
  loading: boolean;
  analysis: ReturnType<typeof useAnalysis>["analysis"];
  isCompleted: boolean;
}) {
  if (!isCompleted) return <NotReady message="Analysis not available yet — call is still processing." />;
  if (loading) return <AnalysisSkeleton />;
  if (!analysis) return <NotReady message="Analysis unavailable." />;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Summary */}
      <Section title="Summary">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
          {analysis.oneLineSummary}
        </p>
        {analysis.executiveSummaryBullets?.length > 0 && (
          <ul className="space-y-2">
            {analysis.executiveSummaryBullets.map((b, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", importanceColor(b.importance))} />
                <span className="text-[var(--text-secondary)] leading-relaxed">{b.text}</span>
              </li>
            ))}
          </ul>
        )}
        {analysis.conversationOutcome && (
          <div className="mt-4 p-3 rounded-lg bg-[var(--brand-dim)] border border-[var(--brand)]/20">
            <p className="text-xs font-semibold text-[var(--brand-light)] mb-1">Outcome</p>
            <p className="text-sm text-[var(--text-secondary)]">{analysis.conversationOutcome}</p>
          </div>
        )}
      </Section>

      {/* Sentiment */}
      {analysis.sentiment && (
        <Section title="Sentiment">
          <div className="space-y-3">
            <SentimentRow
              label="Overall"
              score={analysis.sentiment.score}
              note={analysis.sentiment.reason}
            />
            {analysis.sentiment.userSentiment && (
              <SentimentRow
                label="You"
                score={analysis.sentiment.userSentiment.score}
                note={analysis.sentiment.userSentiment.notes}
              />
            )}
            {analysis.sentiment.contactSentiment && (
              <SentimentRow
                label={analysis.sentiment.contactSentiment.overall ? "Contact" : "Contact"}
                score={analysis.sentiment.contactSentiment.score}
                note={analysis.sentiment.contactSentiment.notes}
              />
            )}
          </div>
          {analysis.sentiment.emotionalSignals && analysis.sentiment.emotionalSignals.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-4">
              {analysis.sentiment.emotionalSignals.map((s) => (
                <span key={s} className="text-xs px-2 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                  {s}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Tone */}
      {analysis.tone && (
        <Section title="Tone">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: "Register", value: analysis.tone.overall },
              { label: "Formality", value: analysis.tone.formality },
              { label: "Energy", value: analysis.tone.energy },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[var(--surface-2)] rounded-lg p-3 border border-[var(--border-subtle)]">
                <p className="text-[10px] text-[var(--text-muted)] mb-1">{label}</p>
                <p className="text-sm font-semibold text-[var(--foreground)] capitalize">{value}</p>
              </div>
            ))}
          </div>
          {analysis.tone.descriptors?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {analysis.tone.descriptors.map((d) => (
                <span key={d} className="text-xs px-2 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] capitalize">
                  {d}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Tags */}
      {analysis.tags?.length > 0 && (
        <Section title="Tags">
          <div className="flex gap-2 flex-wrap">
            {analysis.tags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-[var(--brand-dim)] text-[var(--brand-light)] border border-[var(--brand)]/20">
                {tag}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Quality warnings */}
      {analysis.qualityWarnings?.length > 0 && (
        <div className="flex gap-2 p-3 rounded-lg bg-[var(--warning-dim)] border border-[var(--warning)]/20">
          <AlertCircle size={14} className="text-[var(--warning)] shrink-0 mt-0.5" />
          <div className="space-y-1">
            {analysis.qualityWarnings.map((w, i) => (
              <p key={i} className="text-xs text-[var(--warning)]">{w}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Actions Tab ──────────────────────────────────────────────────────────────

function ActionsTab({
  actions,
  onToggle,
}: {
  actions: ReturnType<typeof useActions>["items"];
  onToggle: ReturnType<typeof useActions>["toggle"];
}) {
  if (actions.length === 0) {
    return <NotReady message="No action items found for this call." />;
  }

  return (
    <div className="max-w-2xl space-y-3">
      {actions.map((a) => (
        <div
          key={a.id}
          className={cn(
            "flex items-start gap-3 p-4 rounded-xl border transition-colors",
            a.status === "COMPLETED"
              ? "border-[var(--border-subtle)] bg-[var(--surface)] opacity-60"
              : "border-[var(--border)] bg-[var(--surface)]"
          )}
        >
          <button
            onClick={() => onToggle(a.id, a.status)}
            className={cn(
              "w-5 h-5 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors",
              a.status === "COMPLETED"
                ? "bg-[var(--positive)] border-[var(--positive)]"
                : "border-[var(--brand)] hover:bg-[var(--brand-dim)]"
            )}
          >
            {a.status === "COMPLETED" && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium", a.status === "COMPLETED" ? "line-through text-[var(--text-muted)]" : "text-[var(--foreground)]")}>
              {a.title}
            </p>
            {a.description && (
              <p className="text-xs text-[var(--text-muted)] mt-1">{a.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {a.dueDate && (
                <span className="text-xs text-[var(--text-muted)]">Due {a.dueDate}</span>
              )}
              {a.intent && a.intent !== "none" && (
                <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-muted)] capitalize">
                  {a.intent}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function SentimentRow({ label, score, note }: { label: string; score: number | null; note?: string }) {
  const pct = score !== null ? ((score + 1) / 2) * 100 : 50;
  const color = score !== null
    ? score > 0.2 ? "bg-[var(--positive)]" : score < -0.2 ? "bg-[var(--negative)]" : "bg-[var(--text-muted)]"
    : "bg-[var(--text-muted)]";

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
        {score !== null && (
          <span className={cn("text-xs font-semibold", score > 0.2 ? "text-[var(--positive)]" : score < -0.2 ? "text-[var(--negative)]" : "text-[var(--text-muted)]")}>
            {score > 0 ? "+" : ""}{score.toFixed(2)}
          </span>
        )}
      </div>
      <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      {note && <p className="text-xs text-[var(--text-muted)] mt-1">{note}</p>}
    </div>
  );
}

function NotReady({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-sm text-[var(--text-muted)]">{message}</p>
    </div>
  );
}

function speakerColor(role: SpeakerRole) {
  if (role === "USER") return "text-[var(--brand-light)]";
  if (role === "CONTACT") return "text-[var(--positive)]";
  return "text-[var(--text-muted)]";
}

function importanceColor(importance: "low" | "medium" | "high") {
  if (importance === "high") return "bg-[var(--negative)]";
  if (importance === "medium") return "bg-[var(--warning)]";
  return "bg-[var(--text-muted)]";
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function TranscriptSkeleton() {
  return (
    <div className="space-y-3 max-w-2xl">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-2">
          <div className="w-10 h-3 bg-[var(--border)] rounded animate-pulse shrink-0 mt-1" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[var(--border)] rounded animate-pulse w-16" />
            <div className="h-3 bg-[var(--border)] rounded animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <div className="h-3 w-20 bg-[var(--border)] rounded animate-pulse mb-3" />
          <div className="space-y-2">
            <div className="h-3 bg-[var(--border)] rounded animate-pulse" />
            <div className="h-3 bg-[var(--border)] rounded animate-pulse w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-16 border-b border-[var(--border)] bg-[var(--surface-2)] animate-pulse" />
      <div className="h-10 border-b border-[var(--border)] animate-pulse" />
      <div className="flex-1 p-6">
        <AnalysisSkeleton />
      </div>
    </div>
  );
}
