"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2, Check } from "lucide-react";

export type EditableField = "title" | "summary" | "notes";

interface Props {
  field: EditableField;
  initialValue: string;
  onSave: (value: string) => Promise<void>;
  onClose: () => void;
}

const LABELS: Record<EditableField, string> = {
  title: "Title",
  summary: "Summary",
  notes: "Notes",
};

const PLACEHOLDERS: Record<EditableField, string> = {
  title: "Call title",
  summary: "Add a one-line summary…",
  notes: "Add your notes…",
};

export function EditCallFieldModal({ field, initialValue, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(draft.trim());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save changes.");
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
  }

  const isDirty = draft.trim() !== initialValue.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Edit {LABELS[field]}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <textarea
            ref={ref}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDERS[field]}
            rows={field === "title" ? 2 : 5}
            disabled={saving}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] disabled:opacity-50 resize-none"
          />
          {error && (
            <p className="text-xs text-[var(--negative)] bg-[var(--negative-dim)] px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)]">⌘↵ to save</p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-3 py-1.5 text-sm rounded-lg text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg bg-[var(--brand)] text-white hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
