"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { ActionItem, ActionItemInput } from "@/types";

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
    const isDone = current === "DONE" || current === "DISMISSED";
    const next: ActionItem["status"] = isDone ? "OPEN" : "DONE";
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status: next } : a)));
    try {
      await apiFetch(`/api/actions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
    } catch {
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status: current } : a)));
    }
  }, []);

  const createAction = useCallback(async (callId: string, data: ActionItemInput): Promise<ActionItem> => {
    const res = await apiFetch(`/api/calls/${callId}/action-items`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    const created: ActionItem = await res.json();
    setItems((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateAction = useCallback(async (id: string, data: ActionItemInput): Promise<ActionItem> => {
    const current = items.find((a) => a.id === id);
    const body = {
      title: data.title,
      description: data.description ?? null,
      dueDate: data.dueDate ?? null,
      priority: data.priority ?? null,
      status: data.status ?? current?.status ?? "OPEN",
    };
    const res = await apiFetch(`/api/action-items/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const updated: ActionItem = await res.json();
    setItems((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, [items]);

  const deleteAction = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/api/action-items/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { items, loading, error, toggle, createAction, updateAction, deleteAction, refresh: load };
}
