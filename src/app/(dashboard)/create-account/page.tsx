"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import { useProfile } from "@/hooks/useProfile";
import { ShieldOff, UserPlus, Loader2, CheckCircle2 } from "lucide-react";

type Role = "USER" | "ADMIN";

export default function CreateAccountPage() {
  const { profile, loading } = useProfile();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  // Super-admin only — the backend enforces this too (404 for anyone else).
  if (!loading && (profile == null || !profile.isSuperAdmin)) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <ShieldOff size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--foreground)]">Not authorized</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Only the super admin can create accounts.
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    setDone(null);
    try {
      // 1) Backend creates the Firebase account (no password) + user row with the role.
      await apiFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ email: trimmed, role }),
      });
      // 2) Firebase sends its built-in email so the person sets their own password.
      await sendPasswordResetEmail(auth, trimmed);
      setDone(`${role === "ADMIN" ? "Admin" : "User"} account created — an invite email was sent to ${trimmed}.`);
      setEmail("");
      setRole("USER");
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 409) setError("An account with that email already exists.");
      else setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <UserPlus size={18} className="text-[var(--brand)]" />
        <h1 className="text-lg font-semibold text-[var(--foreground)]">Create account</h1>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-6">
        Creates a login account and emails an invite so the person sets their own password.
        Admin accounts get the admin console and can&apos;t transcribe.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="person@example.com"
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand)]"
          >
            <option value="USER">User — normal account, can transcribe</option>
            <option value="ADMIN">Admin — admin console, no transcription</option>
          </select>
        </div>

        {error && <p className="text-xs text-[var(--negative)]">{error}</p>}
        {done && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--positive)]">
            <CheckCircle2 size={14} /> {done}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !email.trim()}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-[var(--brand)] text-white text-sm font-medium disabled:opacity-50"
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
          {submitting ? "Creating…" : "Create & send invite"}
        </button>
      </form>
    </div>
  );
}
