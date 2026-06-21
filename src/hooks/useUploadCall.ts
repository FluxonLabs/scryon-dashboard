"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const API_KEY = process.env.NEXT_PUBLIC_SCRYON_API_KEY ?? "";

export interface UploadResult {
  id: string;
  status: string;
}

export function useUploadCall() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File, title?: string): Promise<UploadResult> {
    setUploading(true);
    setError(null);
    try {
      const token = await auth?.currentUser?.getIdToken();

      const form = new FormData();
      form.append("file", file, file.name);
      if (title?.trim()) form.append("title", title.trim());
      form.append("fileName", file.name);

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (API_KEY) headers["X-API-Key"] = API_KEY;

      const res = await fetch(`${BASE_URL}/api/calls/analyze`, {
        method: "POST",
        headers,
        body: form,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Upload failed (${res.status}): ${body}`);
      }

      return (await res.json()) as UploadResult;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
      throw e;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}
