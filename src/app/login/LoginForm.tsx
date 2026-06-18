"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type Mode = "choose" | "email-signin" | "email-signup";

export function LoginForm() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<Mode>("choose");

  // If Firebase restores a session after the AuthGuard already redirected here,
  // bounce the user back to the dashboard.
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "email-signin") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  if (mode === "email-signin" || mode === "email-signup") {
    return (
      <div className="flex flex-col gap-4">
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "email-signup" ? "At least 6 characters" : "Your password"}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-[var(--negative)] bg-[var(--negative-dim)] border border-[var(--negative)]/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[var(--brand)] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === "email-signup" ? "Creating account…" : "Signing in…"}
              </span>
            ) : mode === "email-signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          {mode === "email-signin" ? (
            <span>
              No account?{" "}
              <button onClick={() => { setMode("email-signup"); setError(null); }} className="text-[var(--brand-light)] hover:underline">
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Have an account?{" "}
              <button onClick={() => { setMode("email-signin"); setError(null); }} className="text-[var(--brand-light)] hover:underline">
                Sign in
              </button>
            </span>
          )}
          <button onClick={() => { setMode("choose"); setError(null); }} className="text-[var(--text-muted)] hover:text-[var(--foreground)]">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Google */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] font-medium text-sm hover:border-[var(--brand)] hover:bg-[var(--brand-dim)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-[var(--border)] border-t-[var(--brand)] rounded-full animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[var(--surface)] px-2 text-xs text-[var(--text-muted)]">or</span>
        </div>
      </div>

      {/* Email */}
      <button
        onClick={() => setMode("email-signin")}
        className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] font-medium text-sm hover:border-[var(--brand)] hover:bg-[var(--brand-dim)] transition-all"
      >
        <MailIcon />
        Continue with Email
      </button>

      {error && (
        <p className="text-xs text-[var(--negative)] bg-[var(--negative-dim)] border border-[var(--negative)]/20 rounded-lg px-3 py-2 text-center">
          {error}
        </p>
      )}

      <p className="text-center text-xs text-[var(--text-muted)] mt-1">
        Use the same account as your Android app
      </p>
    </div>
  );
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential")
    return "Incorrect email or password.";
  if (code === "auth/email-already-in-use") return "An account with this email already exists.";
  if (code === "auth/weak-password") return "Password must be at least 6 characters.";
  if (code === "auth/invalid-email") return "Please enter a valid email address.";
  if (code === "auth/too-many-requests") return "Too many attempts. Try again later.";
  if (code === "auth/popup-closed-by-user") return "";
  return err instanceof Error ? err.message : "Sign-in failed. Please try again.";
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
