"use client";

import React from "react";
import AuthGuard from "@/components/auth-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRoles={["admin", "super_admin"]}>
      {children}
    </AuthGuard>
  );
}
