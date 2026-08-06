"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";

// User-only surfaces. Admin/super-admin accounts have no personal calls/actions/contacts, so we
// bounce them to the admin console instead of showing an empty user dashboard.
const USER_ONLY = ["/", "/calls", "/actions", "/contacts"];

export function AdminRedirect() {
  const { profile } = useProfile();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!profile?.isAdmin) return;
    const onUserRoute = USER_ONLY.some((p) =>
      p === "/" ? pathname === "/" : pathname.startsWith(p),
    );
    if (onUserRoute) router.replace("/admin");
  }, [profile?.isAdmin, pathname, router]);

  return null;
}
