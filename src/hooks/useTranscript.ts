"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { Transcript } from "@/types";

export function useTranscript(callId: string) {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/api/calls/${callId}/transcript`)
      .then((r) => r.json())
      .then(setTranscript)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load transcript"))
      .finally(() => setLoading(false));
  }, [callId]);

  return { transcript, loading, error };
}
