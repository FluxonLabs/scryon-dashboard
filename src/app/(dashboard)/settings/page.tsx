"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, Mail, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-8">Settings</h1>

      {/* Profile */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Profile
        </h2>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border-subtle)]">
          <div className="flex items-center gap-4 px-5 py-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[var(--brand)] flex items-center justify-center text-white font-bold text-lg">
                {user?.displayName?.[0] ?? "U"}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {user?.displayName ?? "User"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Signed in with Google</p>
            </div>
          </div>
          <InfoRow icon={User} label="Name" value={user?.displayName ?? "—"} />
          <InfoRow icon={Mail} label="Email" value={user?.email ?? "—"} />
        </div>
      </section>

      {/* App */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          App
        </h2>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border-subtle)]">
          <a
            href="https://scryon.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--surface-2)] transition-colors"
          >
            <span className="text-sm text-[var(--foreground)]">Scryon website</span>
            <ExternalLink size={14} className="text-[var(--text-muted)]" />
          </a>
          <a
            href="https://scryon.app/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--surface-2)] transition-colors"
          >
            <span className="text-sm text-[var(--foreground)]">Privacy Policy</span>
            <ExternalLink size={14} className="text-[var(--text-muted)]" />
          </a>
          <a
            href="https://scryon.app/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--surface-2)] transition-colors"
          >
            <span className="text-sm text-[var(--foreground)]">Terms of Service</span>
            <ExternalLink size={14} className="text-[var(--text-muted)]" />
          </a>
        </div>
      </section>

      {/* Sign out */}
      <section>
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Account
        </h2>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-5 py-3.5 text-sm text-[var(--negative)] hover:bg-[var(--negative-dim)] transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <Icon size={14} className="text-[var(--text-muted)] flex-shrink-0" />
      <span className="text-xs text-[var(--text-muted)] w-14 shrink-0">{label}</span>
      <span className="text-sm text-[var(--foreground)] truncate">{value}</span>
    </div>
  );
}
