"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { AdminAuditLogEntry, Page } from "@/types";

/** `GET /api/admin/audit-log` — admin-only, most-recent-first. */
export function useAdminAuditLog(pageSize = 25, enabled = true) {
  const [items, setItems] = useState<AdminAuditLogEntry[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<(Error & { status?: number }) | null>(null);

  const load = useCallback(async (pageIndex: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(pageIndex), size: String(pageSize) });
      const res = await apiFetch(`/api/admin/audit-log?${params}`);
      const data: Page<AdminAuditLogEntry> = await res.json();
      setItems(data.content);
      setHasMore(pageIndex + 1 < data.totalPages);
      setPage(pageIndex);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load audit log"));
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => { if (!enabled) return; const timer = setTimeout(() => { void load(0); }, 0); return () => clearTimeout(timer); }, [load, enabled]);

  const loadMore = () => { if (hasMore && !loading) load(page + 1); };
  const refresh = () => { setItems([]); setPage(0); setHasMore(true); load(0); };

  return { items, page, previousPage: () => { if (page > 0 && !loading) void load(page - 1); }, loading, error, hasMore, loadMore, refresh };
}
