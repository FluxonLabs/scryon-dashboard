"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { Analysis } from "@/types";

export function useAnalysis(callId: string) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/api/calls/${callId}/analysis`)
      .then((r) => r.json())
      .then(setAnalysis)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load analysis"))
      .finally(() => setLoading(false));
  }, [callId]);

  return { analysis, loading, error };
}
