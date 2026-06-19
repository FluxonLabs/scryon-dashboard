"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import type { Contact } from "@/types";
import type { ContactInput } from "@/hooks/useContacts";

interface Props {
  contact?: Contact | null;
  onSave: (data: ContactInput) => Promise<Contact>;
  onClose: () => void;
}

export function ContactFormModal({ contact, onSave, onClose }: Props) {
  const isEdit = !!contact;
  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phoneNumber ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(contact?.name ?? "");
    setPhone(contact?.phoneNumber ?? "");
    setEmail(contact?.email ?? "");
    setNotes(contact?.notes ?? "");
    setNameError(null);
    setError(null);
  }, [contact]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: trimmed,
        phoneNumber: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save contact");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            {isEdit ? "Edit contact" : "New contact"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-[var(--negative-dim)] border border-[var(--negative)]/20 text-xs text-[var(--negative)]">
              {error}
            </div>
          )}

          <Field
            label="Name *"
            value={name}
            onChange={(v) => { setName(v); setNameError(null); }}
            error={nameError}
            placeholder="Full name"
          />
          <Field
            label="Phone"
            value={phone}
            onChange={setPhone}
            placeholder="+1 (555) 000-0000"
            type="tel"
          />
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="name@example.com"
            type="email"
          />
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] transition-colors resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:border-[var(--brand)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-[var(--brand)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save changes" : "Create contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string | null;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg bg-[var(--surface)] border text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none transition-colors ${
          error ? "border-[var(--negative)]" : "border-[var(--border)] focus:border-[var(--brand)]"
        }`}
      />
      {error && <p className="mt-1 text-xs text-[var(--negative)]">{error}</p>}
    </div>
  );
}
