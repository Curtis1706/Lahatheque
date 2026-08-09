import AuthGuard from "@/components/auth-guard";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex flex-col md:flex-row w-full relative pb-20 md:pb-0">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          {children}
        </main>
        {/* Floating Dock Bottom Navigation for Mobile (21st.dev Floating Nav) */}
        <MobileBottomNav />
      </div>
    </AuthGuard>
  );
}
