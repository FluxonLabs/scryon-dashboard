"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { AdminFeatureFlag } from "@/types";

/** `GET/PATCH /api/admin/feature-flags` — admin-only; non-admin callers get a 404. */
export function useAdminFeatureFlags() {
  const [flags, setFlags] = useState<AdminFeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<(Error & { status?: number }) | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/admin/feature-flags");
      setFlags(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load feature flags"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (flagKey: string, enabled: boolean): Promise<AdminFeatureFlag> => {
    const res = await apiFetch(`/api/admin/feature-flags/${flagKey}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });
    const updated: AdminFeatureFlag = await res.json();
    setFlags((prev) => prev.map((f) => (f.flagKey === flagKey ? updated : f)));
    return updated;
  };

  return { flags, loading, error, refresh: load, toggle };
}
