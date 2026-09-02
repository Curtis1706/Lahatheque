"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function PublicGuideRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "admin" || user.role === "super_admin") {
      router.replace("/admin/guides?mode=read");
    } else if (user.role === "wholesaler" || user.role === "super_client") {
      router.replace("/wholesaler/guide");
    } else if (user.role === "legal_reviewer") {
      router.replace("/legal-reviewer/guide");
    } else if (user.role === "layout_artist") {
      router.replace("/layout-artist/guide");
    } else if (user.role === "chief_layout") {
      router.replace("/chief-layout/guide");
    } else {
      router.replace(`/${user.role}/guide`);
    }
  }, [user, loading, router]);

  return null;
}
