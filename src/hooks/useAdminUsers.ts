"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";
import type { AccountStatus, AdminUserSummary, Page, UploadLimits, UserPlan } from "@/types";

/**
 * `GET /api/admin/users` + credit/status/plan admin actions — admin-only.
 * `search` filters by email substring server-side; changing it restarts pagination.
 */
export function useAdminUsers(pageSize = 50) {
  const [items, setItems] = useState<AdminUserSummary[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<(Error & { status?: number }) | null>(null);
  const [search, setSearchState] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (pageIndex: number, searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(pageIndex), size: String(pageSize) });
      if (searchTerm) params.set("search", searchTerm);
      const res = await apiFetch(`/api/admin/users?${params}`);
      const data: Page<AdminUserSummary> = await res.json();
      setItems((prev) => (pageIndex > 0 ? [...prev, ...data.content] : data.content));
      setHasMore(pageIndex + 1 < data.totalPages);
      setPage(pageIndex);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load users"));
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => { load(0, search); }, [load, search]);

  const loadMore = () => { if (hasMore) load(page + 1, search); };
  const refresh = () => { setItems([]); setPage(0); setHasMore(true); load(0, search); };

  const setSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchState(value), 300);
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
  const getUserFlags = async (userId: string): Promise<Record<string, boolean>> => {
    const res = await apiFetch(`/api/admin/users/${userId}/feature-flags`);
    const data: { flags: Record<string, boolean> } = await res.json();
    return data.flags;
  };

  const setUserFlagOverride = async (
    userId: string,
    key: string,
    enabled: boolean,
  ): Promise<Record<string, boolean>> => {
    const res = await apiFetch(`/api/admin/users/${userId}/feature-flags/${key}`, {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    });
    const data: { flags: Record<string, boolean> } = await res.json();
    return data.flags;
  };

  return {
    items, loading, error, hasMore, loadMore, refresh,
    search, setSearch,
    grantCredits, setAccountStatus, setPlan,
    getUserFlags, setUserFlagOverride,
  };
}
