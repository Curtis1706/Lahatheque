"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookOpen, 
  LayoutDashboard, 
  DollarSign, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight, 
  User 
} from "lucide-react";

export default function PublisherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Tableau de bord", href: "/publisher", icon: LayoutDashboard },
    { name: "Soumissions", href: "/publisher/submissions", icon: FileText },
    { name: "Redevances & Ventes", href: "/publisher/royalties", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-navy/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-dark text-white flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:flex shrink-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        
        {/* Header/Logo */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-navy-hover">
          <Link href="/publisher" className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-gold" />
            <span className="font-serif text-lg font-bold tracking-tight">LAHAThèque</span>
          </Link>
          <button 
            className="lg:hidden text-white hover:text-gold"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="p-4 border-b border-navy-hover flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy-hover flex items-center justify-center text-gold border border-gold/30">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white/90">Laha Éditions Tiers</p>
            <p className="text-[10px] text-gold uppercase tracking-wider font-bold">Éditeur Partenaire</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-4 space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded text-sm font-medium transition-colors duration-200 group ${
                  isActive 
                    ? "bg-gold text-white" 
                    : "text-white/70 hover:bg-navy-hover hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gold group-hover:text-white"}`} />
                  <span>{item.name}</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isActive ? "translate-x-1" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"}`} />
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-navy-hover">
          <Link
            href="/login"
            className="flex items-center gap-3 px-4 py-3 rounded text-sm font-medium text-white/70 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200"
          >
            <LogOut className="w-5 h-5 text-red-400" />
            <span>Déconnexion</span>
          </Link>
        </div>

      </aside>

      {/* Main Container */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Topbar */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-navy hover:text-gold"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-foreground-muted">
              <span>Espace Éditeur</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-navy font-bold">Tableau de bord</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-navy">SYSCOHADA Pro</p>
              <p className="text-[10px] text-foreground-muted">Partenaire n° 458</p>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-grow overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
