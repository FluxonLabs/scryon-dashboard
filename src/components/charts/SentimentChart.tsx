"use client";

import type { Sentiment, Tone } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sentimentColor(overall: string | undefined) {
  switch (overall?.toLowerCase()) {
    case "positive":  return { bg: "bg-[var(--positive-dim)]", text: "text-[var(--positive)]",  dot: "bg-[var(--positive)]"  };
    case "negative":  return { bg: "bg-[var(--negative-dim)]", text: "text-[var(--negative)]",  dot: "bg-[var(--negative)]"  };
    case "mixed":     return { bg: "bg-[var(--warning-dim)]",  text: "text-[var(--warning)]",   dot: "bg-[var(--warning)]"   };
    default:          return { bg: "bg-[var(--surface-2)]",    text: "text-[var(--text-muted)]", dot: "bg-[var(--text-muted)]" };
  }
}

function cap(s: string | undefined | null) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// ─── Call Vibe panel ──────────────────────────────────────────────────────────

interface CallVibePanelProps {
  sentiment?: Sentiment | null;
  tone?: Tone | null;
}

export function CallVibePanel({ sentiment, tone }: CallVibePanelProps) {
  const overall = sentiment?.overall;
  const col = sentimentColor(overall);

  const toneTokens = [
    tone?.overall,
    tone?.formality,
    tone?.energy ? `${cap(tone.energy)} energy` : null,
    tone?.pace   ? `${cap(tone.pace)} pace`     : null,
  ].filter(Boolean).map(cap);

  const toneDescriptors = [
    ...(tone?.descriptors ?? []),
  ];

  return (
    <div className="space-y-5">

      {/* ── Overall sentiment pill + reason ─────────────────────────── */}
      {sentiment && (
        <div className="flex items-start gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${col.bg} ${col.text} shrink-0 mt-0.5`}>
            {cap(overall) || "Unclear"}
          </span>
          {sentiment.reason && (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{sentiment.reason}</p>
          )}
        </div>
      )}

      {/* ── You vs Contact ──────────────────────────────────────────── */}
      {(sentiment?.userSentiment || sentiment?.contactSentiment) && (
        <div className="grid grid-cols-2 gap-3">
          {sentiment.userSentiment && (
            <SpeakerVibeBox label="You" sentiment={sentiment.userSentiment.overall} notes={sentiment.userSentiment.notes} tone={tone?.byParty?.userTone} />
          )}
          {sentiment.contactSentiment && (
            <SpeakerVibeBox label="Contact" sentiment={sentiment.contactSentiment.overall} notes={sentiment.contactSentiment.notes} tone={tone?.byParty?.contactTone} />
          )}
        </div>
      )}

      {/* ── Mood progression timeline ────────────────────────────────── */}
      {sentiment?.progression && sentiment.progression.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Mood through the call</p>
          <div className="flex items-start gap-0">
            {sentiment.progression.map((p, i) => {
              const pc = sentimentColor(p.overall);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                  {/* connector line before dot */}
                  {i > 0 && (
                    <div className="absolute left-0 top-[7px] w-1/2 h-px bg-[var(--border)]" />
                  )}
                  {i < sentiment.progression!.length - 1 && (
                    <div className="absolute right-0 top-[7px] w-1/2 h-px bg-[var(--border)]" />
                  )}
                  <div className={`w-3.5 h-3.5 rounded-full z-10 ${pc.dot} ring-2 ring-[var(--surface)] shadow-sm`} title={p.note ?? ""} />
                  <p className="text-[9px] text-[var(--text-muted)] capitalize text-center leading-tight">{p.phase}</p>
                  {p.note && (
                    <p className="text-[9px] text-[var(--text-secondary)] text-center leading-tight hidden group-hover:block absolute top-7 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1 z-20 w-28 shadow-lg">
                      {p.note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Emotional signals ───────────────────────────────────────── */}
      {sentiment?.emotionalSignals && sentiment.emotionalSignals.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sentiment.emotionalSignals.map((s) => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--brand-dim)] border border-[var(--brand)]/20 text-[var(--brand-light)] capitalize">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* ── Tone footer ─────────────────────────────────────────────── */}
      {(toneTokens.length > 0 || toneDescriptors.length > 0 || tone?.notes) && (
        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
          {toneTokens.length > 0 && (
            <p className="text-xs text-[var(--text-secondary)]">
              <span className="text-[var(--text-muted)] font-medium">Tone · </span>
              {toneTokens.join(" · ")}
            </p>
          )}
          {toneDescriptors.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {toneDescriptors.map((d) => (
                <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] capitalize">
                  {d}
                </span>
              ))}
            </div>
          )}
          {tone?.notes && (
            <p className="text-xs text-[var(--text-muted)] italic">{tone.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Speaker vibe box ─────────────────────────────────────────────────────────

interface SpeakerVibeBoxProps {
  label: string;
  sentiment: string | undefined;
  notes: string | undefined;
  tone?: { overall?: string; descriptors?: string[]; notes?: string } | null;
}

function SpeakerVibeBox({ label, sentiment, notes, tone }: SpeakerVibeBoxProps) {
  const col = sentimentColor(sentiment);
  const toneDesc = tone?.descriptors?.length ? tone.descriptors.slice(0, 2).join(", ") : null;
  const toneLabel = tone?.overall ? cap(tone.overall) : null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 space-y-1.5">
      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
      {sentiment && (
        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${col.bg} ${col.text}`}>
          {cap(sentiment)}
        </span>
      )}
      {notes && <p className="text-xs text-[var(--text-secondary)] leading-snug">{notes}</p>}
      {(toneLabel || toneDesc) && (
        <p className="text-[10px] text-[var(--text-muted)]">
          {[toneLabel, toneDesc].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}
