"use client";

import { DisciplineManager } from "@/components/features/catalog/discipline-manager";

export default function AdminDisciplinesPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto pb-16">
      <DisciplineManager />
    </div>
  );
}
