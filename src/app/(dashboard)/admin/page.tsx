"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAdminFeatureFlags } from "@/hooks/useAdminFeatureFlags";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAdminAuditLog } from "@/hooks/useAdminAuditLog";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { ShieldOff, RefreshCw, Loader2, Gift, Search, ShieldAlert, History, SlidersHorizontal, DatabaseZap, Megaphone, Send, Trash2 } from "lucide-react";
import type { AccountStatus, AdminAskReadiness, AdminAuditLogEntry, AdminFeatureFlag, AdminUserFeatureFlags, AdminUserSummary, UserPlan, Announcement } from "@/types";

// Onboarding flags are managed per account from each user row's Onboarding panel, not as a
// global on/off toggle, so they're hidden from the global Feature flags section.
const ONBOARDING_FLAG_KEYS = ["welcome_screen_enabled", "tutorial_carousel_enabled"];

export default function AdminPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { flags, loading: flagsLoading, error: flagsError, toggle } = useAdminFeatureFlags();
  const {
    items: users, total: usersTotal, loading: usersLoading, error: usersError,
    syncError: usersSyncError, syncResult: usersSyncResult,
    search, setSearch, grantCredits, setAccountStatus, setPlan,
    getUserFlags, setUserFlagOverride, clearUserFlagOverride,
    getAskReadiness, reindexAskForUser,
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
      <AnnouncementsSection users={users} />
      <UsersSection
        users={users}
        total={usersTotal}
        loading={usersLoading}
        syncError={usersSyncError}
        importedFromFirebase={usersSyncResult?.imported ?? 0}
        availableFlags={flags}
        search={search}
        setSearch={setSearch}
        grantCredits={grantCredits}
        setAccountStatus={setAccountStatus}
        setPlan={setPlan}
        getUserFlags={getUserFlags}
        setUserFlagOverride={setUserFlagOverride}
        clearUserFlagOverride={clearUserFlagOverride}
        getAskReadiness={getAskReadiness}
        reindexAskForUser={reindexAskForUser}
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

function AnnouncementsSection({ users }: { users: AdminUserSummary[] }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setItems(await (await apiFetch("/api/admin/announcements")).json()); setError(null); }
    catch { setError("Could not load announcements."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    apiFetch("/api/admin/announcements")
      .then(res => res.json())
      .then(data => { if (active) { setItems(data); setError(null); } })
      .catch(() => { if (active) setError("Could not load announcements."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/api/admin/announcements", { method: "POST", body: JSON.stringify({
        title: title.trim(), message: message.trim(), actionLabel: actionLabel.trim() || null,
        actionUrl: actionUrl.trim() || null, targetUserId: targetUserId || null,
      }) });
      setTitle(""); setMessage(""); setActionLabel(""); setActionUrl(""); setTargetUserId("");
      await load();
    } catch { setError("Could not publish the announcement."); }
    finally { setSaving(false); }
  }

  async function deactivate(id: string) {
    if (!confirm("Remove this announcement from users' inboxes?")) return;
    try { await apiFetch(`/api/admin/announcements/${id}`, { method: "DELETE" }); await load(); }
    catch { setError("Could not deactivate the announcement."); }
  }

  return <section>
    <div className="flex items-center gap-2 mb-3"><Megaphone size={16} className="text-[var(--text-secondary)]" />
      <h2 className="text-sm font-semibold text-[var(--foreground)]">Announcements</h2></div>
    <form onSubmit={publish} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
      <label className="block"><span className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Audience</span>
        <select value={targetUserId} onChange={e => setTargetUserId(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]">
          <option value="">All users (broadcast)</option>
          {users.map(user => <option key={user.id} value={user.id}>{user.email ?? user.displayName ?? user.id}</option>)}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={title} onChange={e => setTitle(e.target.value)} maxLength={160} required placeholder="Announcement title" className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]" />
        <input value={actionLabel} onChange={e => setActionLabel(e.target.value)} maxLength={80} placeholder="Button label (optional)" className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]" />
      </div>
      <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={5000} required rows={3} placeholder="Message shown to all users" className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] resize-y" />
      <input value={actionUrl} onChange={e => setActionUrl(e.target.value)} maxLength={1024} type="url" placeholder="https://… (optional)" className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]" />
      <div className="flex items-center justify-between gap-3"><p className="text-xs text-[var(--text-muted)]">{targetUserId ? "Only the selected user will receive this message." : "Publishing makes this unread for every account."}</p>
        <button disabled={saving} className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Publish</button></div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
    <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border-subtle)] overflow-hidden">
      {loading ? <div className="p-4"><div className="h-10 bg-[var(--border)] rounded animate-pulse" /></div> : items.length === 0 ?
        <p className="p-5 text-center text-xs text-[var(--text-muted)]">No announcements published yet.</p> : items.map(item =>
          <div key={item.id} className="p-4 flex gap-3 justify-between"><div className={cn("min-w-0", !item.active && "opacity-50")}>
            <p className="text-sm font-medium text-[var(--foreground)]">{item.title}</p><p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{item.message}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{new Date(item.publishedAt).toLocaleString()} · {item.active ? "Active" : "Inactive"} · {item.targetUserId ? (users.find(u => u.id === item.targetUserId)?.email ?? "Individual user") : "Broadcast"}</p></div>
            {item.active && <button type="button" onClick={() => deactivate(item.id)} aria-label="Deactivate announcement" className="shrink-0 p-2 text-[var(--text-muted)] hover:text-red-500"><Trash2 size={16} /></button>}
          </div>)}
    </div>
  </section>;
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

  // The welcome/tutorial flags are managed per account (see the Onboarding panel on each user
  // row), so they aren't shown here as a global on/off toggle.
  const visibleFlags = flags.filter((f) => !ONBOARDING_FLAG_KEYS.includes(f.flagKey));

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
          {visibleFlags.map((flag) => (
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
  total,
  loading,
  syncError,
  importedFromFirebase,
  availableFlags,
  search,
  setSearch,
  grantCredits,
  setAccountStatus,
  setPlan,
  getUserFlags,
  setUserFlagOverride,
  clearUserFlagOverride,
  getAskReadiness,
  reindexAskForUser,
}: {
  users: AdminUserSummary[];
  total: number;
  loading: boolean;
  syncError: Error | null;
  importedFromFirebase: number;
  availableFlags: AdminFeatureFlag[];
  search: string;
  setSearch: (value: string) => void;
  grantCredits: (userId: string, minutes: number, transcripts: number) => Promise<unknown>;
  setAccountStatus: (userId: string, status: AccountStatus, reason: string) => Promise<unknown>;
  setPlan: (userId: string, plan: UserPlan) => Promise<unknown>;
  getUserFlags: (userId: string) => Promise<AdminUserFeatureFlags>;
  setUserFlagOverride: (userId: string, key: string, enabled: boolean) => Promise<AdminUserFeatureFlags>;
  clearUserFlagOverride: (userId: string, key: string) => Promise<AdminUserFeatureFlags>;
  getAskReadiness: (userId: string) => Promise<AdminAskReadiness>;
  reindexAskForUser: (userId: string) => Promise<unknown>;
}) {
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<"credits" | "status" | "features" | null>(null);

  function togglePanel(userId: string, panel: "credits" | "status" | "features") {
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
          {loading ? `Loading ${users.length || ""}…` : `${total} ${total === 1 ? "account" : "accounts"}`}
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

      {importedFromFirebase > 0 && (
        <p className="mb-3 text-xs text-[var(--positive)]">
          Imported {importedFromFirebase} {importedFromFirebase === 1 ? "account" : "accounts"} from Firebase Authentication.
        </p>
      )}
      {syncError && (
        <p className="mb-3 text-xs text-[var(--warning)]">
          Firebase account sync was unavailable. Showing accounts already known to Scryon.
        </p>
      )}

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
              availableFlags={availableFlags}
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
              clearUserFlagOverride={(key) => clearUserFlagOverride(u.id, key)}
              getAskReadiness={() => getAskReadiness(u.id)}
              reindexAskForUser={() => reindexAskForUser(u.id)}
            />
          ))}
          {users.length === 0 && !loading && (
            <p className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">No users match this search.</p>
          )}
        </div>
      )}

    </section>
  );
}

function UserRow({
  user,
  availableFlags,
  openPanel,
  onTogglePanel,
  onGrant,
  onSetStatus,
  onSetPlan,
  getUserFlags,
  setUserFlagOverride,
  clearUserFlagOverride,
  getAskReadiness,
  reindexAskForUser,
}: {
  user: AdminUserSummary;
  availableFlags: AdminFeatureFlag[];
  openPanel: "credits" | "status" | "features" | null;
  onTogglePanel: (panel: "credits" | "status" | "features") => void;
  onGrant: (minutes: number, transcripts: number) => Promise<void>;
  onSetStatus: (status: AccountStatus, reason: string) => Promise<void>;
  onSetPlan: (plan: UserPlan) => Promise<void>;
  getUserFlags: () => Promise<AdminUserFeatureFlags>;
  setUserFlagOverride: (key: string, enabled: boolean) => Promise<AdminUserFeatureFlags>;
  clearUserFlagOverride: (key: string) => Promise<AdminUserFeatureFlags>;
  getAskReadiness: () => Promise<AdminAskReadiness>;
  reindexAskForUser: () => Promise<unknown>;
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
      <div className="flex items-center gap-4 flex-wrap">
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
          onClick={() => onTogglePanel("features")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:border-[var(--brand)] transition-colors"
        >
          <SlidersHorizontal size={13} />
          Features
        </button>
      </div>

      {openPanel === "features" && (
        <FeatureOverridesPanel
          availableFlags={availableFlags}
          getUserFlags={getUserFlags}
          setOverride={setUserFlagOverride}
          clearOverride={clearUserFlagOverride}
          getAskReadiness={getAskReadiness}
          reindexAskForUser={reindexAskForUser}
        />
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

function FeatureOverridesPanel({
  availableFlags,
  getUserFlags,
  setOverride,
  clearOverride,
  getAskReadiness,
  reindexAskForUser,
}: {
  availableFlags: AdminFeatureFlag[];
  getUserFlags: () => Promise<AdminUserFeatureFlags>;
  setOverride: (key: string, enabled: boolean) => Promise<AdminUserFeatureFlags>;
  clearOverride: (key: string) => Promise<AdminUserFeatureFlags>;
  getAskReadiness: () => Promise<AdminAskReadiness>;
  reindexAskForUser: () => Promise<unknown>;
}) {
  const [userFlags, setUserFlags] = useState<AdminUserFeatureFlags | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [askReadiness, setAskReadiness] = useState<AdminAskReadiness | null>(null);
  const [askError, setAskError] = useState(false);
  const [reindexing, setReindexing] = useState(false);

  useEffect(() => {
    let active = true;
    getUserFlags()
      .then((f) => { if (active) setUserFlags(f); })
      .catch(() => { if (active) setLoadError(true); });
    getAskReadiness()
      .then((status) => { if (active) setAskReadiness(status); })
      .catch(() => { if (active) setAskError(true); });
    return () => { active = false; };
  }, [getUserFlags, getAskReadiness]);

  useEffect(() => {
    if (!askReadiness?.indexing) return;
    const timer = window.setTimeout(() => {
      getAskReadiness()
        .then(setAskReadiness)
        .catch(() => setAskError(true));
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [askReadiness?.indexing, askReadiness?.indexedCalls, getAskReadiness]);

  async function prepareAsk() {
    setReindexing(true);
    setAskError(false);
    try {
      await reindexAskForUser();
      setAskReadiness(await getAskReadiness());
    } catch {
      setAskError(true);
    } finally {
      setReindexing(false);
    }
  }

  async function update(key: string, value: "inherit" | "enabled" | "disabled") {
    setPending(key);
    try {
      setUserFlags(value === "inherit"
        ? await clearOverride(key)
        : await setOverride(key, value === "enabled"));
    } catch {
      alert("Failed to update the override. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-2">
      <p className="text-xs text-[var(--text-muted)]">
        Choose whether this account inherits each global setting or gets its own value.
      </p>
      {loadError ? (
        <p className="text-xs text-[var(--negative)]">Could not load this account&apos;s features.</p>
      ) : userFlags == null ? (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Loader2 size={13} className="animate-spin" /> Loading…
        </div>
      ) : (
        <>
        {availableFlags.map((flag) => {
          const override = userFlags.overrides[flag.flagKey];
          const value = override === undefined ? "inherit" : override ? "enabled" : "disabled";
          const effective = userFlags.flags[flag.flagKey] ?? false;
          return (
            <div key={flag.flagKey} className="flex items-center justify-between gap-4 py-1">
              <div className="min-w-0">
                <p className="text-sm font-mono text-[var(--foreground)] break-all">{flag.flagKey}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Effective: {effective ? "enabled" : "disabled"} · Global: {flag.enabled ? "enabled" : "disabled"}
                </p>
              </div>
              <select
                value={value}
                onChange={(event) => update(flag.flagKey, event.target.value as "inherit" | "enabled" | "disabled")}
                disabled={pending === flag.flagKey}
                aria-label={`${flag.flagKey} setting for ${value}`}
                className="shrink-0 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-xs font-medium text-[var(--foreground)] disabled:opacity-50"
              >
                <option value="inherit">Inherit global</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          );
        })}
        {availableFlags.some((flag) => flag.flagKey === "ask_enabled") && (
          <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-2 min-w-0">
                <DatabaseZap size={15} className="mt-0.5 shrink-0 text-[var(--brand-light)]" />
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground)]">Ask call index</p>
                  {askReadiness ? (
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {askReadiness.indexedCalls} of {askReadiness.completedCalls} calls ready
                      {askReadiness.indexing ? " · indexing" : askReadiness.ready ? " · ready" : ` · ${askReadiness.unindexedCalls} remaining`}
                    </p>
                  ) : (
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {askError ? "Readiness unavailable. Deploy the Ask backend first." : "Loading readiness…"}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={prepareAsk}
                disabled={reindexing || askReadiness?.indexing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--brand)] text-xs font-medium text-[var(--brand-light)] hover:bg-[var(--brand-dim)] disabled:opacity-40"
              >
                {(reindexing || askReadiness?.indexing) && <Loader2 size={12} className="animate-spin" />}
                {askReadiness?.ready ? "Rebuild index" : "Prepare Ask"}
              </button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}
