"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { CallSummary } from "@/types";

export function useCalls(pageSize = 50) {
  const [items, setItems] = useState<CallSummary[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (pageIndex: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(pageIndex), size: String(pageSize) });
      const res = await apiFetch(`/api/calls?${params}`);
      const data: CallSummary[] = await res.json();
      setItems((prev) => (pageIndex > 0 ? [...prev, ...data] : data));
      setHasMore(data.length === pageSize);
      setPage(pageIndex);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load calls");
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => { load(0); }, [load]);

  const loadMore = () => { if (hasMore) load(page + 1); };
  const refresh = () => { setItems([]); setPage(0); setHasMore(true); load(0); };

  return { items, loading, error, hasMore, loadMore, refresh };
}
