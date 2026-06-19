"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Phone,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { href: "/",         icon: LayoutDashboard, label: "Dashboard" },
  { href: "/calls",    icon: Phone,           label: "Calls" },
  { href: "/actions",  icon: CheckSquare,     label: "Actions" },
  { href: "/contacts", icon: Users,           label: "Contacts" },
  { href: "/settings", icon: Settings,        label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Close drawer whenever the route changes.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll while drawer is open on mobile.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const NavItems = () => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {NAV.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            isActive(href)
              ? "bg-[var(--brand-dim)] text-[var(--brand-light)]"
              : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
          )}
        >
          <Icon size={17} />
          {label}
        </Link>
      ))}
    </nav>
  );

  const UserFooter = () => (
    <div className="border-t border-[var(--border)] p-3">
      <div className="flex items-center gap-3 px-2 py-2 mb-1">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[var(--brand)] flex items-center justify-center text-white text-xs font-bold">
            {user?.displayName?.[0] ?? "U"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--foreground)] truncate">
            {user?.displayName ?? "User"}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] truncate">{user?.email}</p>
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--negative)] hover:bg-[var(--negative-dim)] transition-colors"
      >
        <LogOut size={15} />
        Sign out
      </button>
    </div>
  );

  const Logo = () => (
    <Link href="/">
      <Image src="/logo-blue.png"  alt="Scryon" width={90} height={30} className="h-7 w-auto block dark:hidden" />
      <Image src="/logo-white.png" alt="Scryon" width={90} height={30} className="h-7 w-auto hidden dark:block" />
    </Link>
  );

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 -ml-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <Logo />
      </header>

      {/* ── Mobile backdrop ─────────────────────────────────────────── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop: persistent | mobile: drawer) ─────────── */}
      <aside
        className={cn(
          // structure
          "flex flex-col w-[220px] shrink-0 bg-[var(--surface-2)] border-r border-[var(--border)]",
          // mobile: fixed overlay, slide in/out
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
          // desktop: back in the flow, always visible
          "md:relative md:translate-x-0 md:flex md:flex-col",
        )}
      >
        {/* Logo row */}
        <div className="px-5 h-16 flex items-center justify-between border-b border-[var(--border)] shrink-0">
          <Logo />
          {/* Close button — mobile only */}
          <button
            onClick={() => setOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <NavItems />
        <UserFooter />
      </aside>
    </>
  );
}
