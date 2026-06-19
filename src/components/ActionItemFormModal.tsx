"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionItem, ActionItemInput, ActionItemPriority, CallSummary } from "@/types";

interface Props {
  /** Pass an existing item to edit; null/undefined for create. */
  item?: ActionItem | null;
  /** Required for create — available completed calls to pick from. */
  calls?: CallSummary[];
  /** Pre-select a call (used from Call Detail — cannot be changed). */
  lockedCallId?: string;
  lockedCallTitle?: string;
  onSave: (callId: string, data: ActionItemInput) => Promise<void>;
  onClose: () => void;
}

const PRIORITIES: { value: ActionItemPriority; label: string; color: string }[] = [
  { value: "HIGH",   label: "High",   color: "text-[var(--negative)] bg-[var(--negative-dim)] border-[var(--negative)]/30" },
  { value: "MEDIUM", label: "Medium", color: "text-[var(--warning)]  bg-[var(--warning-dim)]  border-[var(--warning)]/30" },
  { value: "LOW",    label: "Low",    color: "text-[var(--text-secondary)] bg-[var(--surface-2)] border-[var(--border)]" },
];

export function ActionItemFormModal({ item, calls, lockedCallId, lockedCallTitle, onSave, onClose }: Props) {
  const isEdit = !!item;

  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [dueDate, setDueDate] = useState(item?.dueDate ?? "");
  const [priority, setPriority] = useState<ActionItemPriority | "">(item?.priority ?? "");
  const [callId, setCallId] = useState(lockedCallId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(item?.title ?? "");
    setDescription(item?.description ?? "");
    setDueDate(item?.dueDate ?? "");
    setPriority(item?.priority ?? "");
    setCallId(lockedCallId ?? "");
    setTitleError(null);
    setError(null);
  }, [item, lockedCallId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) { setTitleError("Title is required"); return; }
    if (!isEdit && !callId) { setError("Please select a call"); return; }

    setSaving(true);
    setError(null);
    try {
      await onSave(isEdit ? item!.callRecordId : callId, {
        title: trimmedTitle,
        description: description.trim() || null,
        dueDate: dueDate || null,
        priority: priority || null,
        status: item?.status ?? "OPEN",
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {isEdit ? "Edit task" : "Add task"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Call selector — only for create without a locked call */}
          {!isEdit && !lockedCallId && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Linked call <span className="text-[var(--negative)]">*</span>
              </label>
              <select
                value={callId}
                onChange={(e) => setCallId(e.target.value)}
                className="w-full text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] px-3 py-2 focus:outline-none focus:border-[var(--brand)] transition-colors"
              >
                <option value="">Select a call…</option>
                {(calls ?? [])
                  .filter((c) => c.status === "COMPLETED")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title ?? c.originalFileName ?? c.id}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Locked call display */}
          {!isEdit && lockedCallId && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Linked call</label>
              <p className="text-sm text-[var(--foreground)] bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
                {lockedCallTitle ?? lockedCallId}
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Title <span className="text-[var(--negative)]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setTitleError(null); }}
              placeholder="What needs to be done?"
              className={cn(
                "w-full text-sm rounded-lg border bg-[var(--surface)] text-[var(--foreground)] px-3 py-2 focus:outline-none transition-colors placeholder:text-[var(--text-muted)]",
                titleError ? "border-[var(--negative)]" : "border-[var(--border)] focus:border-[var(--brand)]"
              )}
              autoFocus
            />
            {titleError && <p className="text-xs text-[var(--negative)] mt-1">{titleError}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details…"
              rows={3}
              className="w-full text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] px-3 py-2 focus:outline-none focus:border-[var(--brand)] transition-colors resize-none placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Due date + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] px-3 py-2 focus:outline-none focus:border-[var(--brand)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Priority</label>
              <div className="flex gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority((prev) => prev === p.value ? "" : p.value)}
                    className={cn(
                      "flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors",
                      priority === p.value ? p.color : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand-light)]"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-[var(--negative)] bg-[var(--negative-dim)] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[var(--brand)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {isEdit ? "Save changes" : "Add task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
