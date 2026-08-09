import AuthGuard from "@/components/auth-guard";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}
