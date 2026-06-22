"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export interface VibeAnalytics {
  sentimentDistribution: Record<string, number>;
  userSentimentDistribution: Record<string, number>;
  contactSentimentDistribution: Record<string, number>;
  sentimentTrend: { week: string; counts: Record<string, number> }[];
  toneProfile: {
    formality: Record<string, number>;
    energy: Record<string, number>;
    pace: Record<string, number>;
  };
}

export function useVibeAnalytics(days: 30 | 90 | 180 = 30) {
  const [data, setData] = useState<VibeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch(`/api/analytics/vibe?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load vibe analytics"))
      .finally(() => setLoading(false));
  }, [days]);

  return { data, loading, error };
}
