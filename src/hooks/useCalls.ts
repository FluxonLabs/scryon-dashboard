"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { CallSummary, CallsPage } from "@/types";

export function useCalls(limit = 20) {
  const [items, setItems] = useState<CallSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextCursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (nextCursor) params.set("cursor", nextCursor);
      const res = await apiFetch(`/api/calls?${params}`);
      const data: CallsPage = await res.json();
      setItems((prev) => (nextCursor ? [...prev, ...data.items] : data.items));
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load calls");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { load(); }, [load]);

  const loadMore = () => { if (cursor) load(cursor); };
  const refresh = () => { setItems([]); setCursor(null); setHasMore(true); load(); };

  return { items, loading, error, hasMore, loadMore, refresh };
}
