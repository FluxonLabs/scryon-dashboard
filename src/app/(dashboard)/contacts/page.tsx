"use client";

import { useState } from "react";
import { useContacts } from "@/hooks/useContacts";
import { ContactFormModal } from "@/components/ContactFormModal";
import { Users, Plus, Pencil, Trash2, Phone, Mail, RefreshCw, Loader2 } from "lucide-react";
import type { Contact } from "@/types";

export default function ContactsPage() {
  const { contacts, loading, error, refresh, createContact, updateContact, deleteContact } = useContacts();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(c: Contact) {
    setEditing(c);
    setShowForm(true);
  }

  async function handleDelete(c: Contact) {
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    setDeletingId(c.id);
    try {
      await deleteContact(c.id);
    } catch {
      alert("Failed to delete contact. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Contacts</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {loading ? "Loading…" : `${contacts.length} contact${contacts.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:border-[var(--brand)] transition-colors"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--brand)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            New contact
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-[var(--negative-dim)] border border-[var(--negative)]/20 px-4 py-3 text-sm text-[var(--negative)] mb-4">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <ContactListSkeleton />
      ) : contacts.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <Users size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">No contacts yet</p>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Create a contact to assign them to calls.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--brand)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            New contact
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border-subtle)] overflow-hidden">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors group">
              <div className="w-9 h-9 rounded-full bg-[var(--brand-dim)] flex items-center justify-center text-[var(--brand-light)] font-bold text-sm flex-shrink-0">
                {c.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">{c.name}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {c.phoneNumber && (
                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Phone size={11} />
                      {c.phoneNumber}
                    </span>
                  )}
                  {c.email && (
                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Mail size={11} />
                      {c.email}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(c)}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  disabled={deletingId === c.id}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--negative)] hover:bg-[var(--negative-dim)] transition-colors disabled:opacity-40"
                  title="Delete"
                >
                  {deletingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <ContactFormModal
          contact={editing}
          onSave={editing ? (data) => updateContact(editing.id, data) : createContact}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function ContactListSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border-subtle)] overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <div className="w-9 h-9 rounded-full bg-[var(--border)] animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-[var(--border)] rounded animate-pulse w-40" />
            <div className="h-2.5 bg-[var(--border)] rounded animate-pulse w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
