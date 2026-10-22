"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AdminAnalytics } from "@/types";

export function useAdminAnalytics(from: string, to: string) {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch(`/api/admin/analytics/overview?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((value) => {
        setData(value);
        setError(null);
      })
      .catch((failure) => {
        if (failure instanceof DOMException && failure.name === "AbortError") return;
        setError(failure instanceof Error ? failure.message : "Failed to load analytics");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [from, to]);

  return { data, loading, error };
}
