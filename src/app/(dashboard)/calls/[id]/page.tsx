"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useCall } from "@/hooks/useCall";
import { useContacts } from "@/hooks/useContacts";
import { useTranscript } from "@/hooks/useTranscript";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useActions } from "@/hooks/useActions";
import { StatusBadge, SentimentBadge, PriorityDot } from "@/components/StatusBadge";
import { SentimentComparisonChart, SentimentProgressionChart, ToneRadarChart } from "@/components/charts/SentimentChart";
import { DiscussionPhaseChart, ActionIntentChart } from "@/components/charts/AnalysisCharts";
import { ContactSelectorModal } from "@/components/ContactSelectorModal";
import { EditCallFieldModal } from "@/components/EditCallFieldModal";
import { ActionItemFormModal } from "@/components/ActionItemFormModal";
import type { EditableField } from "@/components/EditCallFieldModal";
import { formatDate, formatDuration } from "@/lib/date";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, AlertCircle, UserCircle, UserPlus, Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import type { ActionItem, SpeakerRole } from "@/types";

type Tab = "transcript" | "analysis" | "actions";

export default function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>("transcript");
  const { call, setCall, loading: callLoading } = useCall(id);
  const { contacts, loading: contactsLoading } = useContacts();
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [editField, setEditField] = useState<EditableField | null>(null);
  const { transcript, loading: txLoading } = useTranscript(id);
  const { analysis, loading: anLoading } = useAnalysis(id);
  const { items: allActions, toggle, createAction, updateAction, deleteAction } = useActions();
  const [showActionForm, setShowActionForm] = useState(false);
  const [editAction, setEditAction] = useState<ActionItem | null>(null);
  const [deletingActionId, setDeletingActionId] = useState<string | null>(null);

  const assignedContact = call?.scryonContactId
    ? contacts.find((c) => c.id === call.scryonContactId) ?? null
    : null;

  async function handleAssignContact(contactId: string | null) {
    const res = await apiFetch(`/api/calls/${id}/contact`, {
      method: "PATCH",
      body: JSON.stringify({ contactId }),
    });
    const updated = await res.json();
    setCall(updated);
  }

  async function handleSaveField(value: string) {
    if (!editField) return;
    const body: Record<string, string | null> = {
      title: null,
      summary: null,
      notes: null,
    };
    body[editField === "summary" ? "summary" : editField] = value || null;
    const res = await apiFetch(`/api/calls/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const updated = await res.json();
    setCall(updated);
  }

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
          <div className="flex items-center gap-1.5 group">
            <h1 className="text-base font-bold text-[var(--foreground)] truncate">
              {call?.title ?? call?.contactName ?? "Untitled call"}
            </h1>
            {call && (
              <button
                onClick={() => setEditField("title")}
                className="p-1 rounded text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-all shrink-0"
                aria-label="Edit title"
              >
                <Pencil size={12} />
              </button>
            )}
          </div>
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
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {analysis?.sentiment && (
            <SentimentBadge score={analysis.sentiment.score} overall={analysis.sentiment.overall} />
          )}
          <button
            onClick={() => setShowContactPicker(true)}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:border-[var(--brand)] transition-colors"
          >
            {assignedContact ? (
              <>
                <UserCircle size={12} className="text-[var(--brand-light)]" />
                <span className="text-[var(--brand-light)] font-medium">{assignedContact.name}</span>
              </>
            ) : (
              <>
                <UserPlus size={12} />
                Assign contact
              </>
            )}
          </button>
        </div>
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
          <AnalysisTab
            loading={anLoading}
            analysis={analysis}
            isCompleted={isCompleted}
            userSummary={call?.shortSummary ?? null}
            userNotes={call?.notes ?? null}
            onEditSummary={() => setEditField("summary")}
            onEditNotes={() => setEditField("notes")}
          />
        )}
        {tab === "actions" && (
          <ActionsTab
            actions={callActions}
            onToggle={toggle}
            onAdd={() => { setEditAction(null); setShowActionForm(true); }}
            onEdit={(a) => { setEditAction(a); setShowActionForm(true); }}
            onDelete={async (id) => {
              setDeletingActionId(id);
              try { await deleteAction(id); } finally { setDeletingActionId(null); }
            }}
            deletingId={deletingActionId}
          />
        )}
      </div>

      {/* Contact selector modal */}
      {showContactPicker && (
        <ContactSelectorModal
          contacts={contacts}
          contactsLoading={contactsLoading}
          currentContactId={call?.scryonContactId}
          onPick={handleAssignContact}
          onClose={() => setShowContactPicker(false)}
        />
      )}

      {/* Edit field modal */}
      {editField && (
        <EditCallFieldModal
          field={editField}
          initialValue={
            editField === "title" ? (call?.title ?? "") :
            editField === "summary" ? (call?.shortSummary ?? "") :
            (call?.notes ?? "")
          }
          onSave={handleSaveField}
          onClose={() => setEditField(null)}
        />
      )}

      {/* Action item create / edit modal */}
      {showActionForm && (
        <ActionItemFormModal
          item={editAction}
          lockedCallId={id}
          lockedCallTitle={call?.title ?? call?.contactName ?? undefined}
          onSave={async (callId, data) => {
            if (editAction) {
              await updateAction(editAction.id, data);
            } else {
              await createAction(callId, data);
            }
            setShowActionForm(false);
            setEditAction(null);
          }}
          onClose={() => { setShowActionForm(false); setEditAction(null); }}
        />
      )}
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

function EditableSection({
  title,
  value,
  placeholder,
  onEdit,
}: {
  title: string;
  value: string | null | undefined;
  placeholder: string;
  onEdit: () => void;
}) {
  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{title}</h3>
        <button
          onClick={onEdit}
          className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
          aria-label={`Edit ${title.toLowerCase()}`}
        >
          <Pencil size={12} />
        </button>
      </div>
      {value ? (
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="text-sm text-[var(--text-muted)] italic">{placeholder}</p>
      )}
    </div>
  );
}

function AnalysisTab({
  loading,
  analysis,
  isCompleted,
  userSummary,
  userNotes,
  onEditSummary,
  onEditNotes,
}: {
  loading: boolean;
  analysis: ReturnType<typeof useAnalysis>["analysis"];
  isCompleted: boolean;
  userSummary: string | null;
  userNotes: string | null;
  onEditSummary: () => void;
  onEditNotes: () => void;
}) {
  return (
    <div className="max-w-2xl space-y-6">
      {/* User-editable summary and notes — always visible */}
      <EditableSection
        title="Summary"
        value={userSummary}
        placeholder="No summary yet. Click edit to add one."
        onEdit={onEditSummary}
      />
      <EditableSection
        title="Notes"
        value={userNotes}
        placeholder="No notes yet. Click edit to add yours."
        onEdit={onEditNotes}
      />

      {/* AI Analysis */}
      {!isCompleted ? (
        <NotReady message="AI analysis not available yet — call is still processing." />
      ) : loading ? (
        <AnalysisSkeleton />
      ) : !analysis ? (
        <NotReady message="AI analysis unavailable." />
      ) : (
        <div className="space-y-6">

      {/* AI Summary */}
      <Section title="AI Summary">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
          {analysis.oneLineSummary}
        </p>
        {analysis.executiveSummaryBullets?.length > 0 && (
          <ul className="space-y-2 mb-4">
            {analysis.executiveSummaryBullets.map((b, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", importanceColor(b.importance))} />
                <span className="text-[var(--text-secondary)] leading-relaxed">{b.text}</span>
              </li>
            ))}
          </ul>
        )}
        {analysis.conversationOutcome && (
          <div className="p-3 rounded-lg bg-[var(--brand-dim)] border border-[var(--brand)]/20">
            <p className="text-xs font-semibold text-[var(--brand-light)] mb-1">Outcome</p>
            <p className="text-sm text-[var(--text-secondary)]">{analysis.conversationOutcome}</p>
          </div>
        )}
      </Section>

      {/* Sentiment */}
      {analysis.sentiment && (
        <Section title="Sentiment">
          <SentimentComparisonChart sentiment={analysis.sentiment} />
          <p className="text-xs text-[var(--text-muted)] mt-2 mb-3 italic">{analysis.sentiment.reason}</p>

          {analysis.sentiment.progression && analysis.sentiment.progression.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-[var(--text-muted)] mb-2">Mood progression</p>
              <SentimentProgressionChart progression={analysis.sentiment.progression} />
            </div>
          )}

          {analysis.sentiment.emotionalSignals && analysis.sentiment.emotionalSignals.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {analysis.sentiment.emotionalSignals.map((s) => (
                <span key={s} className="text-xs px-2 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                  {s}
                </span>
              ))}
            </div>
          )}

          {(analysis.sentiment.userSentiment || analysis.sentiment.contactSentiment) && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {analysis.sentiment.userSentiment && (
                <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                  <p className="text-[10px] text-[var(--text-muted)] mb-1">You</p>
                  <p className="text-sm font-semibold text-[var(--foreground)] capitalize">{analysis.sentiment.userSentiment.overall}</p>
                  {analysis.sentiment.userSentiment.notes && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">{analysis.sentiment.userSentiment.notes}</p>
                  )}
                </div>
              )}
              {analysis.sentiment.contactSentiment && (
                <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                  <p className="text-[10px] text-[var(--text-muted)] mb-1">Contact</p>
                  <p className="text-sm font-semibold text-[var(--foreground)] capitalize">{analysis.sentiment.contactSentiment.overall}</p>
                  {analysis.sentiment.contactSentiment.notes && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">{analysis.sentiment.contactSentiment.notes}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {/* Tone */}
      {analysis.tone && (
        <Section title="Tone">
          <ToneRadarChart
            formality={analysis.tone.formality}
            energy={analysis.tone.energy}
            pace={analysis.tone.pace}
            overall={analysis.tone.overall}
          />
          {analysis.tone.notes && (
            <p className="text-xs text-[var(--text-muted)] mt-3 italic">{analysis.tone.notes}</p>
          )}
          {analysis.tone.descriptors?.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {analysis.tone.descriptors.map((d) => (
                <span key={d} className="text-xs px-2 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] capitalize">
                  {d}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Discussion phases + action intents side by side */}
      {(analysis.keyDiscussionPoints?.length > 0 || analysis.actionItems?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {analysis.keyDiscussionPoints?.length > 0 && (
            <DiscussionPhaseChart points={analysis.keyDiscussionPoints} />
          )}
          {analysis.actionItems?.length > 0 && (
            <ActionIntentChart actions={analysis.actionItems} />
          )}
        </div>
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
      )}
    </div>
  );
}

// ─── Actions Tab ──────────────────────────────────────────────────────────────

function ActionsTab({
  actions,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
  deletingId,
}: {
  actions: ActionItem[];
  onToggle: (id: string, status: ActionItem["status"]) => void;
  onAdd: () => void;
  onEdit: (a: ActionItem) => void;
  onDelete: (id: string) => Promise<void>;
  deletingId: string | null;
}) {
  const isDone = (s: string) => s === "DONE" || s === "DISMISSED";
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="max-w-2xl space-y-3">
      {/* Header with Add button */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-[var(--text-muted)]">
          {actions.filter((a) => !isDone(a.status)).length} open · {actions.filter((a) => isDone(a.status)).length} done
        </p>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[var(--brand)] text-white hover:opacity-90 transition-opacity"
        >
          <Plus size={12} />
          Add task
        </button>
      </div>

      {actions.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">No tasks yet</p>
          <p className="text-xs text-[var(--text-muted)]">Add a task to track follow-ups for this call.</p>
        </div>
      ) : (
        actions.map((a) => {
          const done = isDone(a.status);
          const overdue = !done && a.dueDate && new Date(a.dueDate) < new Date(new Date().toDateString());
          return (
            <div
              key={a.id}
              className={cn(
                "group flex items-start gap-3 p-4 rounded-xl border transition-colors",
                done
                  ? "border-[var(--border-subtle)] bg-[var(--surface)] opacity-60"
                  : "border-[var(--border)] bg-[var(--surface)]"
              )}
            >
              <button
                onClick={() => onToggle(a.id, a.status)}
                className={cn(
                  "w-5 h-5 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                  done
                    ? "bg-[var(--positive)] border-[var(--positive)]"
                    : "border-[var(--brand)] hover:bg-[var(--brand-dim)]"
                )}
              >
                {done && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn("text-sm font-medium", done ? "line-through text-[var(--text-muted)]" : "text-[var(--foreground)]")}>
                    {a.title}
                  </p>
                  {a.priority && (
                    <span className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded border",
                      a.priority === "HIGH" ? "bg-[var(--negative-dim)] text-[var(--negative)] border-[var(--negative)]/30" :
                      a.priority === "MEDIUM" ? "bg-[var(--warning-dim)] text-[var(--warning)] border-[var(--warning)]/30" :
                      "bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)]"
                    )}>
                      {a.priority.charAt(0) + a.priority.slice(1).toLowerCase()}
                    </span>
                  )}
                  {a.source === "AI" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--brand-dim)] text-[var(--brand-light)] border border-[var(--brand)]/20">
                      AI
                    </span>
                  )}
                </div>
                {a.description && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">{a.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {a.dueDate && (
                    <span className={cn(
                      "text-xs",
                      overdue ? "text-[var(--negative)] font-medium" : "text-[var(--text-muted)]"
                    )}>
                      {overdue ? "Overdue · " : "Due "}{a.dueDate}
                    </span>
                  )}
                  {a.intent && a.intent !== "none" && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-muted)] capitalize">
                      {a.intent}
                    </span>
                  )}
                </div>
              </div>

              {/* Row actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => onEdit(a)}
                  className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
                  aria-label="Edit"
                >
                  <Pencil size={13} />
                </button>
                {deletingId === a.id ? (
                  <span className="p-1.5"><Loader2 size={13} className="animate-spin text-[var(--text-muted)]" /></span>
                ) : confirmDeleteId === a.id ? (
                  <span className="flex items-center gap-1">
                    <button
                      onClick={async () => { await onDelete(a.id); setConfirmDeleteId(null); }}
                      className="text-[10px] px-1.5 py-1 rounded bg-[var(--negative)] text-white font-medium"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-[10px] px-1.5 py-1 rounded border border-[var(--border)] text-[var(--text-muted)]"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(a.id)}
                    className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--negative)] hover:bg-[var(--negative-dim)] transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
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
