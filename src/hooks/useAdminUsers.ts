"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";
import type { AccountStatus, AdminAskReadiness, AdminAskReindexResult, AdminUserFeatureFlags, AdminUserSummary, AdminUserSyncResult, Page, UploadLimits, UserPlan } from "@/types";

/**
 * `GET /api/admin/users` + credit/status/plan admin actions — admin-only.
 * `search` filters by email substring server-side; changing it restarts pagination.
 */
export function useAdminUsers(pageSize = 25, enabled = true) {
  const [items, setItems] = useState<AdminUserSummary[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<(Error & { status?: number }) | null>(null);
  const [syncError, setSyncError] = useState<Error | null>(null);
  const [syncResult, setSyncResult] = useState<AdminUserSyncResult | null>(null);
  const [search, setSearchState] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);
  const hasSyncedRef = useRef(false);

  const load = useCallback(async (searchTerm: string) => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      if (!hasSyncedRef.current) {
        hasSyncedRef.current = true;
        setSyncError(null);
        try {
          const syncResponse = await apiFetch("/api/admin/users/sync-firebase", { method: "POST" });
          setSyncResult(await syncResponse.json());
        } catch (syncFailure) {
          // Keep the existing Scryon directory usable if Firebase Admin is temporarily
          // unavailable or the backend is deployed before service credentials are configured.
          setSyncError(syncFailure instanceof Error ? syncFailure : new Error("Firebase sync failed"));
        }
      }

      const params = new URLSearchParams({ page: String(page), size: String(pageSize) });
      if (searchTerm) params.set("search", searchTerm);
      const res = await apiFetch(`/api/admin/users?${params}`);
      const data: Page<AdminUserSummary> = await res.json();
      if (requestId !== requestRef.current) return;
      setItems(data.content);
      setTotal(data.totalElements);
    } catch (e) {
      if (requestId === requestRef.current) {
        setError(e instanceof Error ? e : new Error("Failed to load users"));
      }
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [pageSize, page]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => { void load(search); }, 0);
    return () => { window.clearTimeout(timer); requestRef.current += 1; };
  }, [load, search, enabled]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const refresh = () => {
    hasSyncedRef.current = false;
    setItems([]);
    setTotal(0);
    void load(search);
  };

  const setSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(0); setSearchState(value); }, 300);
  };

  const grantCredits = async (
    userId: string,
    minutes: number,
    transcripts: number,
  ): Promise<UploadLimits> => {
    const res = await apiFetch(`/api/admin/users/${userId}/grant-credits`, {
      method: "POST",
      body: JSON.stringify({ minutes, transcripts }),
    });
    const updatedLimits: UploadLimits = await res.json();
    setItems((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              topupMinutesBalance: updatedLimits.topupMinutesBalance,
              topupTranscriptsBalance: updatedLimits.topupTranscriptsBalance,
            }
          : u,
      ),
    );
    return updatedLimits;
  };

  const setAccountStatus = async (
    userId: string,
    status: AccountStatus,
    reason: string,
  ): Promise<AdminUserSummary> => {
    const res = await apiFetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason: reason || null }),
    });
    const updated: AdminUserSummary = await res.json();
    setItems((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    return updated;
  };

  const setPlan = async (userId: string, plan: UserPlan): Promise<AdminUserSummary> => {
    const res = await apiFetch(`/api/admin/users/${userId}/plan`, {
      method: "PATCH",
      body: JSON.stringify({ plan }),
    });
    const updated: AdminUserSummary = await res.json();
    setItems((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    return updated;
  };

  // Per-account feature-flag overrides (e.g. welcome_screen_enabled,
  // tutorial_carousel_enabled). Returns the account's resolved flag map.
  const getUserFlags = async (userId: string): Promise<AdminUserFeatureFlags> => {
    const res = await apiFetch(`/api/admin/users/${userId}/feature-flags`);
    return res.json();
  };

  const setUserFlagOverride = async (
    userId: string,
    key: string,
    enabled: boolean,
  ): Promise<AdminUserFeatureFlags> => {
    const res = await apiFetch(`/api/admin/users/${userId}/feature-flags/${key}`, {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    });
    return res.json();
  };

  const clearUserFlagOverride = async (
    userId: string,
    key: string,
  ): Promise<AdminUserFeatureFlags> => {
    const res = await apiFetch(`/api/admin/users/${userId}/feature-flags/${key}`, {
      method: "DELETE",
    });
    return res.json();
  };

  const getAskReadiness = async (userId: string): Promise<AdminAskReadiness> => {
    const res = await apiFetch(`/api/admin/ask/users/${userId}/readiness`);
    return res.json();
  };

  const reindexAskForUser = async (userId: string): Promise<AdminAskReindexResult> => {
    const res = await apiFetch(`/api/admin/ask/users/${userId}/reindex`, { method: "POST" });
    return res.json();
  };

  return {
    items, total, page, setPage, totalPages: Math.ceil(total / pageSize), loading, error, syncError, syncResult, refresh,
    search, setSearch,
    grantCredits, setAccountStatus, setPlan,
    getUserFlags, setUserFlagOverride, clearUserFlagOverride,
    getAskReadiness, reindexAskForUser,
  };
}
