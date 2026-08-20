"use client";

import React from "react";
import AuthGuard from "@/components/auth-guard";

export default function WholesalerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRoles={["wholesaler", "admin", "super_admin"]}>
      {children}
    </AuthGuard>
  );
}
