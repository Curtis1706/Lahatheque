"use client";

import React from "react";
import AuthGuard from "@/components/auth-guard";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRoles={["manager", "admin", "super_admin"]}>
      {children}
    </AuthGuard>
  );
}
