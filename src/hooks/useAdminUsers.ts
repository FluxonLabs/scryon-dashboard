"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { AdminUserSummary, Page, UploadLimits } from "@/types";

/** `GET /api/admin/users` + `POST /api/admin/users/{id}/grant-credits` — admin-only. */
export function useAdminUsers(pageSize = 50) {
  const [items, setItems] = useState<AdminUserSummary[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<(Error & { status?: number }) | null>(null);

  const load = useCallback(async (pageIndex: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(pageIndex), size: String(pageSize) });
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

  useEffect(() => { load(0); }, [load]);

  const loadMore = () => { if (hasMore) load(page + 1); };
  const refresh = () => { setItems([]); setPage(0); setHasMore(true); load(0); };

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

  return { items, loading, error, hasMore, loadMore, refresh, grantCredits };
}
