"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAdminFeatureFlags } from "@/hooks/useAdminFeatureFlags";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAdminAuditLog } from "@/hooks/useAdminAuditLog";
import { cn } from "@/lib/utils";
import { ShieldOff, RefreshCw, Loader2, Gift, Search, ShieldAlert, History, Sparkles } from "lucide-react";
import { useEffect } from "react";
import type { AccountStatus, AdminAuditLogEntry, AdminUserSummary, UserPlan } from "@/types";

export default function AdminPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { flags, loading: flagsLoading, error: flagsError, toggle } = useAdminFeatureFlags();
  const {
    items: users, loading: usersLoading, error: usersError, hasMore, loadMore,
    search, setSearch, grantCredits, setAccountStatus, setPlan, getUserFlags, setUserFlagOverride,
  } = useAdminUsers();
  const { items: auditEntries, loading: auditLoading, error: auditError, hasMore: auditHasMore, loadMore: auditLoadMore } = useAdminAuditLog();

  // The backend hides every /api/admin/** route as a 404 for non-admins (same masking
  // discipline as other feature-gated surfaces) — that 404 is the real authorization
  // boundary, not `profile.isAdmin` alone, which could be stale.
  const notAuthorized =
    (!profileLoading && profile != null && !profile.isAdmin) ||
    flagsError?.status === 404 ||
    usersError?.status === 404 ||
    auditError?.status === 404;

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
        <p className="text-sm text-[var(--text-secondary)] mt-1">Feature flags, account management, and audit trail.</p>
      </div>

      <FeatureFlagsSection flags={flags} loading={flagsLoading} toggle={toggle} />
      <UsersSection
        users={users}
        loading={usersLoading}
        hasMore={hasMore}
        loadMore={loadMore}
        search={search}
        setSearch={setSearch}
        grantCredits={grantCredits}
        setAccountStatus={setAccountStatus}
        setPlan={setPlan}
        getUserFlags={getUserFlags}
        setUserFlagOverride={setUserFlagOverride}
      />
      <AuditLogSection
        entries={auditEntries}
        loading={auditLoading}
        hasMore={auditHasMore}
        loadMore={auditLoadMore}
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

const ACCOUNT_STATUS_MAP: Record<AccountStatus, { label: string; className: string }> = {
  ACTIVE:    { label: "Active",    className: "bg-[var(--positive-dim)] text-[var(--positive)] border-[var(--positive)]" },
  SUSPENDED: { label: "Suspended", className: "bg-[var(--warning-dim)] text-[var(--warning)] border-[var(--warning)]" },
  DISABLED:  { label: "Disabled",  className: "bg-[var(--negative-dim)] text-[var(--negative)] border-[var(--negative)]" },
};

function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const { label, className } = ACCOUNT_STATUS_MAP[status];
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded border", className)}>
      {label}
    </span>
  );
}

function UsersSection({
  users,
  loading,
  hasMore,
  loadMore,
  search,
  setSearch,
  grantCredits,
  setAccountStatus,
  setPlan,
  getUserFlags,
  setUserFlagOverride,
}: {
  users: AdminUserSummary[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  search: string;
  setSearch: (value: string) => void;
  grantCredits: (userId: string, minutes: number, transcripts: number) => Promise<unknown>;
  setAccountStatus: (userId: string, status: AccountStatus, reason: string) => Promise<unknown>;
  setPlan: (userId: string, plan: UserPlan) => Promise<unknown>;
  getUserFlags: (userId: string) => Promise<Record<string, boolean>>;
  setUserFlagOverride: (userId: string, key: string, enabled: boolean) => Promise<Record<string, boolean>>;
}) {
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<"credits" | "status" | "onboarding" | null>(null);

  function togglePanel(userId: string, panel: "credits" | "status" | "onboarding") {
    if (openRowId === userId && openPanel === panel) {
      setOpenRowId(null);
      setOpenPanel(null);
    } else {
      setOpenRowId(userId);
      setOpenPanel(panel);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Users</h2>
        <p className="text-xs text-[var(--text-muted)]">
          {loading && users.length === 0 ? "Loading…" : `${users.length} loaded`}
        </p>
      </div>

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          defaultValue={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email…"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)]"
        />
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
              openPanel={openRowId === u.id ? openPanel : null}
              onTogglePanel={(panel) => togglePanel(u.id, panel)}
              onGrant={async (minutes, transcripts) => {
                try {
                  await grantCredits(u.id, minutes, transcripts);
                  setOpenRowId(null);
                  setOpenPanel(null);
                } catch {
                  alert("Failed to grant credits. Please try again.");
                }
              }}
              onSetStatus={async (status, reason) => {
                try {
                  await setAccountStatus(u.id, status, reason);
                  setOpenRowId(null);
                  setOpenPanel(null);
                } catch {
                  alert("Failed to update account status. Please try again.");
                }
              }}
              onSetPlan={async (plan) => {
                try {
                  await setPlan(u.id, plan);
                } catch {
                  alert("Failed to change plan. Please try again.");
                }
              }}
              getUserFlags={() => getUserFlags(u.id)}
              setUserFlagOverride={(key, enabled) => setUserFlagOverride(u.id, key, enabled)}
            />
          ))}
          {users.length === 0 && !loading && (
            <p className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">No users match this search.</p>
          )}
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
  openPanel,
  onTogglePanel,
  onGrant,
  onSetStatus,
  onSetPlan,
  getUserFlags,
  setUserFlagOverride,
}: {
  user: AdminUserSummary;
  openPanel: "credits" | "status" | "onboarding" | null;
  onTogglePanel: (panel: "credits" | "status" | "onboarding") => void;
  onGrant: (minutes: number, transcripts: number) => Promise<void>;
  onSetStatus: (status: AccountStatus, reason: string) => Promise<void>;
  onSetPlan: (plan: UserPlan) => Promise<void>;
  getUserFlags: () => Promise<Record<string, boolean>>;
  setUserFlagOverride: (key: string, enabled: boolean) => Promise<Record<string, boolean>>;
}) {
  const [minutes, setMinutes] = useState("");
  const [transcripts, setTranscripts] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [statusSubmitting, setStatusSubmitting] = useState<AccountStatus | null>(null);
  const [planPending, setPlanPending] = useState(false);

  async function handleSubmitCredits() {
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

  async function handleSetStatus(status: AccountStatus) {
    setStatusSubmitting(status);
    try {
      await onSetStatus(status, reason);
      setReason("");
    } finally {
      setStatusSubmitting(null);
    }
  }

  async function handlePlanChange(plan: UserPlan) {
    if (plan === user.plan) return;
    setPlanPending(true);
    try {
      await onSetPlan(plan);
    } finally {
      setPlanPending(false);
    }
  }

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-[var(--foreground)] truncate">
              {user.displayName || user.email || user.id}
            </p>
            <AccountStatusBadge status={user.accountStatus} />
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-[var(--text-muted)]">
            <span>{user.email}</span>
            <span>{user.topupMinutesBalance} top-up min</span>
            <span>{user.topupTranscriptsBalance} top-up transcripts</span>
            {user.accountStatusReason && <span>reason: {user.accountStatusReason}</span>}
          </div>
        </div>
        <select
          value={user.plan}
          disabled={planPending}
          onChange={(e) => handlePlanChange(e.target.value as UserPlan)}
          className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-xs font-medium text-[var(--foreground)] disabled:opacity-50"
        >
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
        </select>
        <button
          onClick={() => onTogglePanel("status")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:border-[var(--brand)] transition-colors"
        >
          <ShieldAlert size={13} />
          Manage status
        </button>
        <button
          onClick={() => onTogglePanel("credits")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:border-[var(--brand)] transition-colors"
        >
          <Gift size={13} />
          Grant credits
        </button>
        <button
          onClick={() => onTogglePanel("onboarding")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:border-[var(--brand)] transition-colors"
        >
          <Sparkles size={13} />
          Onboarding
        </button>
      </div>

      {openPanel === "onboarding" && (
        <OnboardingOverridesPanel getUserFlags={getUserFlags} setOverride={setUserFlagOverride} />
      )}

      {openPanel === "credits" && (
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
            onClick={handleSubmitCredits}
            disabled={submitting || (!Number(minutes) && !Number(transcripts))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--brand)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : "Grant"}
          </button>
        </div>
      )}

      {openPanel === "status" && (
        <div className="flex items-end gap-2 mt-3 pt-3 border-t border-[var(--border-subtle)] flex-wrap">
          <label className="flex flex-col gap-1 flex-1 min-w-[160px]">
            <span className="text-xs text-[var(--text-muted)]">Reason (optional)</span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. abuse report, inactivity"
              className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-sm text-[var(--foreground)]"
            />
          </label>
          <button
            onClick={() => handleSetStatus("ACTIVE")}
            disabled={statusSubmitting !== null || user.accountStatus === "ACTIVE"}
            className="px-3 py-2 rounded-lg border border-[var(--positive)] text-[var(--positive)] text-sm font-medium hover:bg-[var(--positive-dim)] transition-colors disabled:opacity-40"
          >
            {statusSubmitting === "ACTIVE" ? <Loader2 size={14} className="animate-spin" /> : "Activate"}
          </button>
          <button
            onClick={() => handleSetStatus("SUSPENDED")}
            disabled={statusSubmitting !== null || user.accountStatus === "SUSPENDED"}
            className="px-3 py-2 rounded-lg border border-[var(--warning)] text-[var(--warning)] text-sm font-medium hover:bg-[var(--warning-dim)] transition-colors disabled:opacity-40"
          >
            {statusSubmitting === "SUSPENDED" ? <Loader2 size={14} className="animate-spin" /> : "Suspend"}
          </button>
          <button
            onClick={() => handleSetStatus("DISABLED")}
            disabled={statusSubmitting !== null || user.accountStatus === "DISABLED"}
            className="px-3 py-2 rounded-lg border border-[var(--negative)] text-[var(--negative)] text-sm font-medium hover:bg-[var(--negative-dim)] transition-colors disabled:opacity-40"
          >
            {statusSubmitting === "DISABLED" ? <Loader2 size={14} className="animate-spin" /> : "Disable"}
          </button>
        </div>
      )}
    </div>
  );
}

function AuditLogSection({
  entries,
  loading,
  hasMore,
  loadMore,
}: {
  entries: AdminAuditLogEntry[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <History size={15} className="text-[var(--text-secondary)]" />
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Audit log</h2>
      </div>

      {loading && entries.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-[var(--border)] rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border-subtle)] overflow-hidden">
          {entries.map((entry) => (
            <div key={entry.id} className="px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm text-[var(--foreground)]">
                  <span className="font-mono font-medium">{entry.action}</span>
                  <span className="text-[var(--text-muted)]"> · {entry.targetType}</span>
                  {entry.targetId && <span className="text-[var(--text-muted)]"> {entry.targetId}</span>}
                </p>
                {entry.details && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{entry.details}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-[var(--text-secondary)]">{entry.actorEmail}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{new Date(entry.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {entries.length === 0 && !loading && (
            <p className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">No admin actions recorded yet.</p>
          )}
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

function OnboardingOverridesPanel({
  getUserFlags,
  setOverride,
}: {
  getUserFlags: () => Promise<Record<string, boolean>>;
  setOverride: (key: string, enabled: boolean) => Promise<Record<string, boolean>>;
}) {
  const [flags, setFlags] = useState<Record<string, boolean> | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getUserFlags()
      .then((f) => { if (active) setFlags(f); })
      .catch(() => { if (active) setFlags({}); });
    return () => { active = false; };
  }, [getUserFlags]);

  const ROWS = [
    { key: "welcome_screen_enabled", label: "Welcome screen" },
    { key: "tutorial_carousel_enabled", label: "Tutorial carousel" },
  ];

  async function toggle(key: string, next: boolean) {
    setPending(key);
    try {
      setFlags(await setOverride(key, next));
    } catch {
      alert("Failed to update the override. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-2">
      <p className="text-xs text-[var(--text-muted)]">
        Per-account onboarding — overrides the global flag for this user only.
      </p>
      {flags == null ? (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Loader2 size={13} className="animate-spin" /> Loading…
        </div>
      ) : (
        ROWS.map(({ key, label }) => {
          const on = flags[key] ?? true;
          return (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-[var(--foreground)]">{label}</span>
              <button
                onClick={() => toggle(key, !on)}
                disabled={pending === key}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors disabled:opacity-50",
                  on
                    ? "bg-[var(--brand-dim)] text-[var(--brand-light)] border-transparent"
                    : "text-[var(--text-secondary)] border-[var(--border)]",
                )}
              >
                {pending === key ? "…" : on ? "On" : "Off"}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
