"use client";

import { useState } from "react";
import { X, Check, UserMinus, Loader2, Users } from "lucide-react";
import type { Contact } from "@/types";

interface Props {
  contacts: Contact[];
  contactsLoading: boolean;
  currentContactId?: string | null;
  onPick: (contactId: string | null) => Promise<void>;
  onClose: () => void;
}

export function ContactSelectorModal({ contacts, contactsLoading, currentContactId, onPick, onClose }: Props) {
  const [pickingId, setPickingId] = useState<string | null | "remove">(null);

  async function pick(id: string | null) {
    setPickingId(id ?? "remove");
    try {
      await onPick(id);
      onClose();
    } finally {
      setPickingId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl shadow-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Assign contact</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {/* Remove row */}
          {currentContactId && (
            <button
              onClick={() => pick(null)}
              disabled={pickingId !== null}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[var(--negative-dim)] transition-colors border-b border-[var(--border-subtle)]"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--negative-dim)] flex items-center justify-center flex-shrink-0">
                {pickingId === "remove" ? (
                  <Loader2 size={14} className="animate-spin text-[var(--negative)]" />
                ) : (
                  <UserMinus size={14} className="text-[var(--negative)]" />
                )}
              </div>
              <span className="text-sm font-medium text-[var(--negative)]">Remove contact</span>
            </button>
          )}

          {/* Contacts list */}
          {contactsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-10 px-5">
              <Users size={24} className="text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-muted)]">
                No contacts yet. Create one in the Contacts page.
              </p>
            </div>
          ) : (
            contacts.map((c) => {
              const isSelected = c.id === currentContactId;
              const isPicking = pickingId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => pick(c.id)}
                  disabled={pickingId !== null}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[var(--surface)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--brand-dim)] flex items-center justify-center text-[var(--brand-light)] font-bold text-xs flex-shrink-0">
                    {isPicking ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      c.name[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{c.name}</p>
                    {(c.phoneNumber || c.email) && (
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {c.phoneNumber ?? c.email}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Check size={16} className="text-[var(--brand-light)] flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
