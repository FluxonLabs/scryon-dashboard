"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { CallDetail } from "@/types";

export function useCall(callId: string) {
  const [call, setCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/calls/${callId}`);
      setCall(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load call");
    } finally {
      setLoading(false);
    }
  }, [callId]);

  useEffect(() => { load(); }, [load]);

  return { call, setCall, loading, error, refresh: load };
}
