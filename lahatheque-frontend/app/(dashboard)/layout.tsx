import AuthGuard from "@/components/auth-guard";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex flex-col md:flex-row w-full">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
