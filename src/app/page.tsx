export const dynamic = "force-dynamic";
import { AuthGuard } from "@/components/AuthGuard";

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--brand)] flex items-center justify-center text-white text-xl font-black mx-auto mb-4">
            S
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)]">Phase 2 — coming next</p>
        </div>
      </div>
    </AuthGuard>
  );
}
