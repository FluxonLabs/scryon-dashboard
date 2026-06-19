"use client";

import Link from "next/link";
import { useActions } from "@/hooks/useActions";
import { useCalls } from "@/hooks/useCalls";
import { useContacts } from "@/hooks/useContacts";
import { ActionItemFormModal } from "@/components/ActionItemFormModal";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import type { ActionItem, ActionItemPriority } from "@/types";

type StatusFilter = "open" | "done" | "all";
type PriorityFilter = ActionItemPriority | "ALL";

const isDone = (s: string) => s === "DONE" || s === "DISMISSED";

export default function ActionsPage() {
  const { items, loading, error, toggle, createAction, updateAction, deleteAction } = useActions();
  const { items: calls, loading: callsLoading } = useCalls(200);
  const { contacts } = useContacts();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [contactFilter, setContactFilter] = useState<string>("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ActionItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Build a callId → call lookup
  const callMap = useMemo(
    () => new Map(calls.map((c) => [c.id, c])),
    [calls]
  );

  // Build contactId → contact lookup
  const contactMap = useMemo(
    () => new Map(contacts.map((c) => [c.id, c])),
    [contacts]
  );

  // For a given action item, look up which contact is linked via the call
  function contactForItem(item: ActionItem) {
    const call = callMap.get(item.callRecordId);
    if (!call?.scryonContactId) return null;
    return contactMap.get(call.scryonContactId) ?? null;
  }

  // Unique contacts that appear in action items (for filter dropdown)
  const linkedContacts = useMemo(() => {
    const seen = new Map<string, string>();
    items.forEach((item) => {
      const c = contactForItem(item);
      if (c) seen.set(c.id, c.name);
    });
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, callMap, contactMap]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === "open" && isDone(item.status)) return false;
      if (statusFilter === "done" && !isDone(item.status)) return false;
      if (priorityFilter !== "ALL" && item.priority !== priorityFilter) return false;
      if (contactFilter !== "ALL") {
        const c = contactForItem(item);
        if (!c || c.id !== contactFilter) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, statusFilter, priorityFilter, contactFilter, callMap, contactMap]);

  const openCount = items.filter((a) => !isDone(a.status)).length;
  const doneCount = items.filter((a) => isDone(a.status)).length;

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteAction(id);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function handleSave(callId: string, data: Parameters<typeof createAction>[1]) {
    if (editItem) {
      await updateAction(editItem.id, data);
    } else {
      await createAction(callId, data);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-[var(--foreground)]">Tasks</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {loading ? "Loading…" : `${openCount} open · ${doneCount} done`}
          </p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-[var(--brand)] text-white hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          Add task
        </button>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-[var(--border)] flex items-center gap-3 flex-wrap shrink-0 bg-[var(--surface-2)]">
        {/* Status */}
        <div className="flex gap-1">
          {(["open", "done", "all"] as StatusFilter[]).map((s) => {
            const count = s === "open" ? openCount : s === "done" ? doneCount : items.length;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors capitalize",
                  statusFilter === s
                    ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                    : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand-light)]"
                )}
              >
                {s === "open" ? "Open" : s === "done" ? "Done" : "All"} ({count})
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-[var(--border)]" />

        {/* Priority */}
        <div className="flex gap-1">
          {(["ALL", "HIGH", "MEDIUM", "LOW"] as PriorityFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={cn(
                "text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors",
                priorityFilter === p
                  ? p === "HIGH"
                    ? "bg-[var(--negative-dim)] border-[var(--negative)]/40 text-[var(--negative)]"
                    : p === "MEDIUM"
                    ? "bg-[var(--warning-dim)] border-[var(--warning)]/40 text-[var(--warning)]"
                    : p === "LOW"
                    ? "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)]"
                    : "bg-[var(--brand)] border-[var(--brand)] text-white"
                  : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand-light)]"
              )}
            >
              {p === "ALL" ? "All priority" : p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Contact filter */}
        {linkedContacts.length > 0 && (
          <>
            <div className="h-4 w-px bg-[var(--border)]" />
            <select
              value={contactFilter}
              onChange={(e) => setContactFilter(e.target.value)}
              className="text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] px-2.5 py-1.5 focus:outline-none focus:border-[var(--brand)] transition-colors"
            >
              <option value="ALL">All contacts</option>
              {linkedContacts.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="m-6 rounded-lg bg-[var(--negative-dim)] border border-[var(--negative)]/20 px-4 py-3 text-sm text-[var(--negative)] flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState statusFilter={statusFilter} priorityFilter={priorityFilter} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <th className="w-8 px-4 py-2.5" />
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Title</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">Linked call</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden lg:table-cell">Contact</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Due</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Priority</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                  <th className="w-20 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filtered.map((item) => {
                  const call = callMap.get(item.callRecordId);
                  const contact = contactForItem(item);
                  const done = isDone(item.status);
                  const overdue = !done && item.dueDate && new Date(item.dueDate) < new Date(new Date().toDateString());
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "group transition-colors hover:bg-[var(--surface)]",
                        done && "opacity-60"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggle(item.id, item.status)}
                          className={cn(
                            "w-4.5 h-4.5 rounded border flex items-center justify-center transition-colors shrink-0",
                            done
                              ? "bg-[var(--positive)] border-[var(--positive)]"
                              : "border-[var(--border)] hover:border-[var(--brand)]"
                          )}
                          aria-label={done ? "Mark as open" : "Mark as done"}
                        >
                          {done && (
                            <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </td>

                      {/* Title */}
                      <td className="px-3 py-3 max-w-xs">
                        <p className={cn(
                          "font-medium truncate",
                          done ? "line-through text-[var(--text-muted)]" : "text-[var(--foreground)]"
                        )}>
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{item.description}</p>
                        )}
                        {item.source === "AI" && (
                          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--brand-dim)] text-[var(--brand-light)] border border-[var(--brand)]/20">
                            AI
                          </span>
                        )}
                      </td>

                      {/* Linked call */}
                      <td className="px-3 py-3 hidden md:table-cell">
                        {call ? (
                          <Link
                            href={`/calls/${item.callRecordId}`}
                            className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--brand-light)] transition-colors group/link max-w-[160px]"
                          >
                            <span className="truncate">{call.title ?? call.originalFileName ?? "Untitled"}</span>
                            <ArrowRight size={10} className="opacity-0 group-hover/link:opacity-100 shrink-0" />
                          </Link>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">—</span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-3 py-3 hidden lg:table-cell">
                        {contact ? (
                          <span className="text-xs text-[var(--text-secondary)] truncate max-w-[120px] block">
                            {contact.name}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">—</span>
                        )}
                      </td>

                      {/* Due date */}
                      <td className="px-3 py-3 hidden sm:table-cell">
                        {item.dueDate ? (
                          <span className={cn(
                            "text-xs whitespace-nowrap",
                            overdue ? "text-[var(--negative)] font-medium" : "text-[var(--text-muted)]"
                          )}>
                            {overdue ? "Overdue · " : ""}{item.dueDate}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">—</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-3">
                        <PriorityBadge priority={item.priority} />
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <span className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap",
                          done
                            ? "bg-[var(--positive-dim)] text-[var(--positive)] border-[var(--positive)]/30"
                            : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]"
                        )}>
                          {done ? "Done" : "Open"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditItem(item); setShowForm(true); }}
                            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                            aria-label="Edit task"
                          >
                            <Pencil size={13} />
                          </button>
                          {deletingId === item.id ? (
                            <span className="p-1.5">
                              <Loader2 size={13} className="animate-spin text-[var(--text-muted)]" />
                            </span>
                          ) : confirmDeleteId === item.id ? (
                            <span className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(item.id)}
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
                              onClick={() => setConfirmDeleteId(item.id)}
                              className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--negative)] hover:bg-[var(--negative-dim)] transition-colors"
                              aria-label="Delete task"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <ActionItemFormModal
          item={editItem}
          calls={calls}
          onSave={async (callId, data) => { await handleSave(callId, data); setShowForm(false); setEditItem(null); }}
          onClose={() => { setShowForm(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: ActionItemPriority | null }) {
  if (!priority) return <span className="text-xs text-[var(--text-muted)]">—</span>;
  const cfg = {
    HIGH:   "bg-[var(--negative-dim)] text-[var(--negative)] border-[var(--negative)]/30",
    MEDIUM: "bg-[var(--warning-dim)]  text-[var(--warning)]  border-[var(--warning)]/30",
    LOW:    "bg-[var(--surface-2)]    text-[var(--text-secondary)] border-[var(--border)]",
  }[priority];
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap", cfg)}>
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
}

function EmptyState({ statusFilter, priorityFilter }: { statusFilter: StatusFilter; priorityFilter: PriorityFilter }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <CheckSquare size={32} className="text-[var(--text-muted)] mb-3" />
      <p className="text-sm font-medium text-[var(--foreground)] mb-1">
        {statusFilter === "open" && priorityFilter === "ALL" ? "All caught up!" : "No matching tasks"}
      </p>
      <p className="text-xs text-[var(--text-muted)]">
        {statusFilter === "open" && priorityFilter === "ALL"
          ? "Action items from your calls will appear here, or add one manually."
          : "Try adjusting the filters above."}
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-[var(--border-subtle)]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="w-4 h-4 rounded border border-[var(--border)] animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-[var(--border)] rounded animate-pulse w-56" />
            <div className="h-2.5 bg-[var(--border)] rounded animate-pulse w-36" />
          </div>
          <div className="h-3 bg-[var(--border)] rounded animate-pulse w-20 hidden md:block" />
          <div className="h-3 bg-[var(--border)] rounded animate-pulse w-14 hidden sm:block" />
          <div className="h-5 bg-[var(--border)] rounded animate-pulse w-12" />
        </div>
      ))}
    </div>
  );
}
