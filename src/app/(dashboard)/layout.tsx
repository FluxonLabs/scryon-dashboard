import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-[var(--background)]">
        <Sidebar />

        {/* pt-14 on mobile offsets the fixed top bar; desktop has no top bar */}
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
