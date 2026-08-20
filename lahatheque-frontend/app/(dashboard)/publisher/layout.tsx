"use client";

import React from "react";
import AuthGuard from "@/components/auth-guard";

export default function PublisherLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRoles={["publisher", "admin", "super_admin"]}>
      {children}
    </AuthGuard>
  );
}
