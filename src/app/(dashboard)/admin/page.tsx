"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAdminFeatureFlags } from "@/hooks/useAdminFeatureFlags";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { ShieldOff, RefreshCw, Loader2, Gift } from "lucide-react";
import type { AdminUserSummary } from "@/types";

export default function AdminPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { flags, loading: flagsLoading, error: flagsError, toggle } = useAdminFeatureFlags();
  const { items: users, loading: usersLoading, error: usersError, hasMore, loadMore, grantCredits } = useAdminUsers();

  // The backend hides every /api/admin/** route as a 404 for non-admins (same masking
  // discipline as other feature-gated surfaces) — that 404 is the real authorization
  // boundary, not `profile.isAdmin` alone, which could be stale.
  const notAuthorized =
    (!profileLoading && profile != null && !profile.isAdmin) ||
    flagsError?.status === 404 ||
    usersError?.status === 404;

  if (notAuthorized) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <ShieldOff size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--foreground)]">Not authorized</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            This account does not have access to the admin console.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Admin console</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Feature flags and account management.</p>
      </div>

      <FeatureFlagsSection flags={flags} loading={flagsLoading} toggle={toggle} />
      <UsersSection
        users={users}
        loading={usersLoading}
        hasMore={hasMore}
        loadMore={loadMore}
        grantCredits={grantCredits}
      />
    </div>
  );
}

function FeatureFlagsSection({
  flags,
  loading,
  toggle,
}: {
  flags: { flagKey: string; enabled: boolean; updatedAt: string | null; updatedBy: string | null }[];
  loading: boolean;
  toggle: (key: string, enabled: boolean) => Promise<unknown>;
}) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  async function handleToggle(key: string, next: boolean) {
    setPendingKey(key);
    try {
      await toggle(key, next);
    } catch {
      alert("Failed to update the flag. Please try again.");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">Feature flags</h2>
      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="h-10 bg-[var(--border)] rounded animate-pulse" />
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border-subtle)] overflow-hidden">
          {flags.map((flag) => (
            <div key={flag.flagKey} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-mono font-medium text-[var(--foreground)]">{flag.flagKey}</p>
                {flag.updatedBy && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Last changed by {flag.updatedBy}
                    {flag.updatedAt && ` on ${new Date(flag.updatedAt).toLocaleString()}`}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleToggle(flag.flagKey, !flag.enabled)}
                disabled={pendingKey === flag.flagKey}
                className={`shrink-0 relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                  flag.enabled ? "bg-[var(--brand)]" : "bg-[var(--border)]"
                }`}
                aria-label={`Toggle ${flag.flagKey}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    flag.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function UsersSection({
  users,
  loading,
  hasMore,
  loadMore,
  grantCredits,
}: {
  users: AdminUserSummary[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  grantCredits: (userId: string, minutes: number, transcripts: number) => Promise<unknown>;
}) {
  const [grantingId, setGrantingId] = useState<string | null>(null);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Users</h2>
        <p className="text-xs text-[var(--text-muted)]">
          {loading && users.length === 0 ? "Loading…" : `${users.length} loaded`}
        </p>
      </div>

      {loading && users.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-[var(--border)] rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border-subtle)] overflow-hidden">
          {users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isGranting={grantingId === u.id}
              onOpenGrant={() => setGrantingId(grantingId === u.id ? null : u.id)}
              onGrant={async (minutes, transcripts) => {
                try {
                  await grantCredits(u.id, minutes, transcripts);
                  setGrantingId(null);
                } catch {
                  alert("Failed to grant credits. Please try again.");
                }
              }}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:border-[var(--brand)] transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Load more
        </button>
      )}
    </section>
  );
}

function UserRow({
  user,
  isGranting,
  onOpenGrant,
  onGrant,
}: {
  user: AdminUserSummary;
  isGranting: boolean;
  onOpenGrant: () => void;
  onGrant: (minutes: number, transcripts: number) => Promise<void>;
}) {
  const [minutes, setMinutes] = useState("");
  const [transcripts, setTranscripts] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const m = Number(minutes) || 0;
    const t = Number(transcripts) || 0;
    if (m <= 0 && t <= 0) return;
    setSubmitting(true);
    try {
      await onGrant(m, t);
      setMinutes("");
      setTranscripts("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)] truncate">
            {user.displayName || user.email || user.id}
          </p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-[var(--text-muted)]">
            <span>{user.email}</span>
            <span>{user.plan}</span>
            <span>{user.topupMinutesBalance} top-up min</span>
            <span>{user.topupTranscriptsBalance} top-up transcripts</span>
          </div>
        </div>
        <button
          onClick={onOpenGrant}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:border-[var(--brand)] transition-colors"
        >
          <Gift size={13} />
          Grant credits
        </button>
      </div>

      {isGranting && (
        <div className="flex items-end gap-2 mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--text-muted)]">Minutes</span>
            <input
              type="number"
              min={0}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-24 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-sm text-[var(--foreground)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--text-muted)]">Transcripts</span>
            <input
              type="number"
              min={0}
              value={transcripts}
              onChange={(e) => setTranscripts(e.target.value)}
              className="w-24 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-sm text-[var(--foreground)]"
            />
          </label>
          <button
            onClick={handleSubmit}
            disabled={submitting || (!Number(minutes) && !Number(transcripts))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--brand)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : "Grant"}
          </button>
        </div>
      )}
    </div>
  );
}
