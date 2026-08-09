import AuthGuard from "@/components/auth-guard";
import { DashboardHeader } from "@/components/ui/dashboard-header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <DashboardHeader />
        <div className="flex-1">{children}</div>
      </div>
    </AuthGuard>
  );
}
