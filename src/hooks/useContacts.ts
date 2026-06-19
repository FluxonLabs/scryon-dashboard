"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { Contact } from "@/types";

export interface ContactInput {
  name: string;
  phoneNumber?: string | null;
  email?: string | null;
  notes?: string | null;
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/contacts");
      setContacts(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createContact = async (data: ContactInput): Promise<Contact> => {
    const res = await apiFetch("/api/contacts", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const created: Contact = await res.json();
    setContacts((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  };

  const updateContact = async (id: string, data: ContactInput): Promise<Contact> => {
    const res = await apiFetch(`/api/contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    const updated: Contact = await res.json();
    setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteContact = async (id: string): Promise<void> => {
    await apiFetch(`/api/contacts/${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  return { contacts, loading, error, refresh: load, createContact, updateContact, deleteContact };
}
