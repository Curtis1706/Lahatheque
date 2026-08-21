"use client";

import React from "react";
import { AuthGuard } from "@/components/auth-guard";

export default function UniversityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRoles={["university", "admin", "super_admin"]}>
      {children}
    </AuthGuard>
  );
}
