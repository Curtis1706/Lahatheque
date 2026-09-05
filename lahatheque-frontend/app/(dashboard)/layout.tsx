"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import AuthGuard from "@/components/auth-guard";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { AnimatedSidebarProvider, AnimatedSidebarInset } from "@/components/motion/animated-sidebar";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { NotificationBell } from "@/components/ui/notification-bell";
import { ContactSupportDialog } from "@/components/ui/contact-support-dialog";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class DashboardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-navy text-white border border-red-500 rounded-xl m-4 max-w-2xl mx-auto space-y-4">
          <h2 className="text-lg font-bold text-red-400">Une erreur critique est survenue dans l&apos;interface :</h2>
          <pre className="text-xs bg-navy-dark text-red-300 p-4 rounded-lg overflow-auto whitespace-pre-wrap font-mono">
            {this.state.error?.stack || this.state.error?.message}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-gold text-navy font-bold rounded-lg hover:bg-gold-hover transition-colors text-xs"
          >
            Recharger la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardErrorBoundary>
      <AuthGuard>
        <AnimatedSidebarProvider defaultOpen={false}>
          <div className="min-h-screen bg-background flex flex-col md:flex-row w-full relative pb-20 md:pb-0">
            <NotificationBell />
            <DashboardSidebar />
            <AnimatedSidebarInset className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-background">
              <div className="flex-1 min-w-0">
                <React.Suspense
                  fallback={
                    <div className="p-6 space-y-4 animate-pulse max-w-7xl mx-auto w-full">
                      <div className="h-8 bg-background-secondary rounded-xl w-1/4" />
                      <div className="h-64 bg-background-secondary rounded-3xl" />
                    </div>
                  }
                >
                  {children}
                </React.Suspense>
              </div>
            </AnimatedSidebarInset>
            {/* Floating Dock Bottom Navigation for Mobile (21st.dev Floating Nav) */}
            <MobileBottomNav />
            {/* Modale de Contact Support globale */}
            <ContactSupportDialog />
          </div>
        </AnimatedSidebarProvider>
      </AuthGuard>
    </DashboardErrorBoundary>
  );
}
