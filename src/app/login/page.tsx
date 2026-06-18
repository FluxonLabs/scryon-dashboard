import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Scryon dashboard.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-4">
      <Link href="https://scryon.app" className="absolute top-6 left-6 flex items-center">
        <Image src="/logo-blue.png"  alt="Scryon" width={90} height={30} className="h-7 w-auto block dark:hidden" />
        <Image src="/logo-white.png" alt="Scryon" width={90} height={30} className="h-7 w-auto hidden dark:block" />
      </Link>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Welcome back</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Sign in to access your calls and insights
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          By signing in you agree to our{" "}
          <Link href="https://scryon.app/terms" className="text-[var(--brand-light)] hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="https://scryon.app/privacy" className="text-[var(--brand-light)] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
