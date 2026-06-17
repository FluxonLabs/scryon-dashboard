"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { CallDetail } from "@/types";

export function useCall(callId: string) {
  const [call, setCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/api/calls/${callId}`)
      .then((r) => r.json())
      .then(setCall)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load call"))
      .finally(() => setLoading(false));
  }, [callId]);

  return { call, loading, error };
}
