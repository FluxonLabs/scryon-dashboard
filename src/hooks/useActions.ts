"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { ActionItem } from "@/types";

export function useActions() {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/actions");
      const data: ActionItem[] = await res.json();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load actions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback(async (id: string, current: ActionItem["status"]) => {
    const isDone = current === "COMPLETED" || current === "DONE" || current === "DISMISSED";
    const next: ActionItem["status"] = isDone ? "PENDING" : "COMPLETED";
    // Optimistic update
    setItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: next } : a))
    );
    try {
      await apiFetch(`/api/actions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
    } catch {
      // Rollback on failure
      setItems((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: current } : a))
      );
    }
  }, []);

  return { items, loading, error, toggle, refresh: load };
}
