"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Menu, 
  X, 
  Search, 
  User, 
  ShoppingCart,
  ArrowRight
} from "lucide-react";
import { HeaderSearchBar } from "@/components/features/search/header-search-bar";
import { useCart } from "@/context/cart-context";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ContactSupportDialog } from "@/components/ui/contact-support-dialog";
import { useAuth } from "@/hooks/use-auth";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { totalCount, toggleDrawer } = useCart();

  const roleDashboardMap: Record<string, string> = {
    admin: "/admin",
    super_admin: "/admin",
    university: "/university",
    publisher: "/publisher",
    author: "/author",
    teacher: "/teacher",
    student: "/student",
    parent: "/student",
    wholesaler: "/wholesaler",
    super_client: "/wholesaler",
    legal_reviewer: "/legal-reviewer",
    layout_artist: "/layout-artist",
    chief_layout: "/chief-layout",
    manager: "/manager",
  };
  const dashboardUrl = user ? ((user.role && roleDashboardMap[user.role]) || `/${user.role || "student"}`) : "/login";

  // Fermeture par Escape + verrouillage du scroll body
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isDrawerOpen || isSearchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isDrawerOpen, isSearchOpen]);

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200 overflow-x-hidden">
      
      {/* TopNavBar */}
      <header className="bg-background border-b border-border sticky top-0 z-50 transition-all duration-300">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 2xl:px-24 py-3 md:py-4 max-w-[1920px] mx-auto">

          {/* 1. Brand Logo (Left) */}
          <Link href="/" className="block w-28 sm:w-36 md:w-40 shrink-0">
            <img src="/logo.jpg" alt="LAHATHÈQUE" className="w-full h-auto object-contain" />
          </Link>

          {/* 2. Desktop Navigation (Centered) — hidden on mobile/tablet */}
          <nav className="hidden lg:flex items-center justify-center gap-5 xl:gap-8 px-4" aria-label="Navigation principale">
            <Link
              href="/"
              className={pathname === "/"
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap"
                : "text-foreground [@media(hover:hover)]:hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Accueil
            </Link>

            <Link
              href="/about"
              className={pathname === "/about"
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap"
                : "text-foreground [@media(hover:hover)]:hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              À propos
            </Link>

            <Link
              href="/authors"
              className={pathname.startsWith("/authors")
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap"
                : "text-foreground [@media(hover:hover)]:hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Auteur
            </Link>

            <Link
              href="/partners"
              className={pathname.startsWith("/partners")
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap"
                : "text-foreground [@media(hover:hover)]:hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Partenariat
            </Link>

            <Link
              href="/prestations"
              className={pathname.startsWith("/prestations")
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap"
                : "text-foreground [@media(hover:hover)]:hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Nos prestations
            </Link>

            <Link
              href="/subscriptions"
              className={pathname.startsWith("/subscriptions")
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap"
                : "text-foreground [@media(hover:hover)]:hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Nos offres
            </Link>

            <Link
              href="/catalog"
              className={pathname.startsWith("/catalog")
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap"
                : "text-foreground [@media(hover:hover)]:hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Catalogue
            </Link>
          </nav>

          {/* 3. Actions & Search (Right) */}
          <div className="flex items-center gap-1 sm:gap-2 xl:gap-4 shrink-0">
            {/* Desktop Search Bar */}
            <div className="hidden md:block w-48 xl:w-72">
              <HeaderSearchBar placeholder="Rechercher..." />
            </div>

            {/* Desktop Connexion / Espace Link */}
            {user ? (
              <Link
                href={dashboardUrl}
                className="hidden lg:flex items-center gap-2 text-navy hover:text-gold font-bold text-sm whitespace-nowrap bg-gold/10 hover:bg-gold/20 px-3 py-1.5 rounded-xl border border-gold/30 transition-all"
              >
                <User className="w-4 h-4 text-gold" />
                <span>Mon Espace</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden lg:flex items-center gap-2 text-foreground [@media(hover:hover)]:hover:text-navy font-medium text-sm whitespace-nowrap"
              >
                <User className="w-5 h-5 text-gold" /> Connexion
              </Link>
            )}

            {/* Mobile Search Icon — opens overlay */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex md:hidden p-3 text-foreground transition-colors cursor-pointer"
              aria-label="Rechercher"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Cart Icon & Trigger */}
            <button
              type="button"
              onClick={toggleDrawer}
              className="relative p-3 text-foreground [@media(hover:hover)]:hover:text-navy transition-colors shrink-0 cursor-pointer"
              aria-label="Panier d'achat"
            >
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              {totalCount > 0 && (
                <span className="absolute top-1 right-1 bg-gold text-navy text-[10px] font-bold font-mono min-w-[18px] h-[18px] px-0.5 rounded-full flex items-center justify-center shadow-md">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="lg:hidden p-3 text-foreground transition-colors cursor-pointer"
              aria-label="Ouvrir le menu"
              aria-expanded={isDrawerOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Navigation Drawer ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${
          isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          onClick={closeDrawer}
        />
        {/* Drawer Panel */}
        <nav
          className={`absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-background shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
          aria-label="Menu mobile"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <Link href="/" onClick={closeDrawer} className="block w-28">
              <img src="/logo.jpg" alt="LAHATHÈQUE" className="w-full h-auto object-contain" />
            </Link>
            <button
              type="button"
              onClick={closeDrawer}
              className="p-2 text-foreground-muted transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Links */}
          <div className="flex-1 overflow-y-auto py-2">
            {[
              { href: "/", label: "Accueil", active: pathname === "/" },
              { href: "/catalog", label: "Catalogue", active: pathname.startsWith("/catalog") },
              { href: "/about", label: "À propos", active: pathname === "/about" },
              { href: "/authors", label: "Auteur", active: pathname.startsWith("/authors") },
              { href: "/partners", label: "Partenariat", active: pathname.startsWith("/partners") },
              { href: "/subscriptions", label: "Nos offres", active: pathname.startsWith("/subscriptions") },
              { href: "/prestations", label: "Nos prestations", active: pathname.startsWith("/prestations") },
              { href: "/contact", label: "Contact", active: pathname === "/contact" },
            ].map(({ href, label, active }) => (
              <Link
                key={href}
                href={href}
                onClick={closeDrawer}
                className={`flex items-center justify-between px-5 py-3.5 text-sm font-medium border-b border-border/40 transition-colors ${
                  active
                    ? "text-navy font-bold bg-gold/5"
                    : "text-foreground"
                }`}
              >
                <span>{label}</span>
                {active && <ArrowRight className="w-4 h-4 text-gold" />}
              </Link>
            ))}
          </div>

          {/* Drawer Footer — Connexion / Mon Espace */}
          <div className="shrink-0 p-4 border-t border-border">
            {user ? (
              <Link
                href={dashboardUrl}
                onClick={closeDrawer}
                className="flex items-center justify-center gap-2 w-full py-3 bg-navy text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
              >
                <User className="w-4 h-4 text-gold" />
                <span>Mon Espace ({user.first_name || user.email})</span>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={closeDrawer}
                className="flex items-center justify-center gap-2 w-full py-3 bg-navy text-white rounded-xl font-medium text-sm transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Se connecter</span>
              </Link>
            )}
          </div>
        </nav>
      </div>

      {/* ── Mobile Search Overlay ── */}
      <div
        className={`fixed inset-0 z-[70] transition-opacity duration-200 ${
          isSearchOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-background flex flex-col">
          {/* Search Overlay Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
            <Search className="w-5 h-5 text-foreground-muted shrink-0" />
            <div className="flex-1">
              <HeaderSearchBar
                placeholder="Rechercher un ouvrage, un auteur..."
              />
            </div>
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="p-2 text-foreground-muted shrink-0"
              aria-label="Fermer la recherche"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Cart Slide-Over Drawer Global */}
      <CartDrawer />

      {/* Footer Component */}
      <footer className="bg-navy text-white border-t border-navy-hover">
        <div className="max-w-[1920px] mx-auto px-6 md:px-12 xl:px-16 2xl:px-24 py-14">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-white/10">
            
            {/* Colonne 1 : Marque */}
            <div className="lg:col-span-3 space-y-4">
              <Link href="/" className="inline-block bg-white p-2.5 rounded-xl">
                <img src="/logo.jpg" alt="LAHATHÈQUE" className="h-9 w-auto object-contain" />
              </Link>
              <p className="text-white/80 text-xs sm:text-sm leading-relaxed max-w-sm">
                La première bibliothèque numérique panafricaine pour les étudiants, enseignants et chercheurs.
              </p>
            </div>

            {/* Colonne 2 : Informations & Navigation */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="font-serif font-bold text-gold text-sm tracking-wide">Informations</h4>
              <ul className="space-y-2 text-xs text-white/80">
                <li>
                  <Link href="/" className="hover:text-gold transition-colors">Accueil</Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-gold transition-colors">À propos</Link>
                </li>
                <li>
                  <Link href="/catalog" className="hover:text-gold transition-colors">Catalogue</Link>
                </li>
                <li>
                  <Link href="/prestations" className="hover:text-gold transition-colors">Nos prestations</Link>
                </li>
                <li>
                  <Link href="/subscriptions" className="hover:text-gold transition-colors">Nos offres</Link>
                </li>
                <li>
                  <Link href="/authors" className="hover:text-gold transition-colors">Auteurs</Link>
                </li>
                <li>
                  <Link href="/partners" className="hover:text-gold transition-colors">Partenariat</Link>
                </li>
                <li>
                  <Link href="/submit" className="hover:text-gold transition-colors">Soumettre un manuscrit</Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-gold transition-colors">Aide &amp; Contact</Link>
                </li>
              </ul>
            </div>

            {/* Colonne 3 : Nos Autres Sites */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="font-serif font-bold text-gold text-sm tracking-wide">Nos autres sites</h4>
              <ul className="space-y-2 text-xs text-white/80">
                <li>
                  <a href="https://lahacademia.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1.5">
                    lahacademia.com
                  </a>
                </li>
                <li>
                  <a href="https://lahakim.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1.5">
                    lahakim.com
                  </a>
                </li>
                <li>
                  <a href="https://gabonlivres.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1.5">
                    gabonlivres.com
                  </a>
                </li>
                <li>
                  <a href="https://lahaeditions.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1.5">
                    lahaeditions.com
                  </a>
                </li>
                <li>
                  <a href="https://lahalex.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1.5">
                    lahalex.com
                  </a>
                </li>
                <li>
                  <a href="https://kultutv.bj/" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1.5">
                    kultutv.bj
                  </a>
                </li>
              </ul>
            </div>

            {/* Colonne 4 : Contacts Bénin & Togo */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="font-serif font-bold text-gold text-sm tracking-wide">Contacts au Bénin et au Togo</h4>
              <div className="space-y-3 text-xs text-white/80">
                <div className="space-y-1">
                  <p className="font-bold text-white">Bénin</p>
                  <p className="text-white/70">Cotonou, Kouhounnou, Bénin</p>
                  <p className="font-mono text-[11px] text-gold-light">+229 01 97 89 82 42</p>
                  <p className="font-mono text-[11px] text-gold-light">+229 01 58 58 48 48</p>
                  <p className="font-mono text-[11px] text-gold-light">+229 01 62 07 79 79</p>
                </div>
                <div className="space-y-1 pt-1 border-t border-white/10">
                  <p className="font-bold text-white">LAHA EDITIONS TOGO</p>
                  <p className="text-white/70">12 BP 330 Lomé (BAGUIDA), TOGO</p>
                  <p className="font-mono text-[11px] text-gold-light">+228 90 54 20 44</p>
                  <p className="font-mono text-[11px] text-gold-light">+228 99 75 55 17</p>
                </div>
                <div className="pt-1 border-t border-white/10">
                  <a href="mailto:lahaeditions1@gmail.com" className="text-gold hover:underline break-all">
                    lahaeditions1@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Colonne 5 : Contacts dans les autres pays */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="font-serif font-bold text-gold text-sm tracking-wide">Autres pays</h4>
              <div className="space-y-3 text-xs text-white/80">
                <div className="space-y-1">
                  <p className="font-bold text-white">Gabon</p>
                  <p className="text-white/70 leading-tight">142 Av. Jean Léon MEGUIRE ME MBA, Nouvelle Cité NZENG AGNON, Libreville</p>
                  <p className="font-mono text-[11px] text-gold-light">+241 04 01 91 85</p>
                  <p className="font-mono text-[11px] text-gold-light">+241 02 18 31 00</p>
                </div>
                <div className="space-y-1 pt-1 border-t border-white/10">
                  <p className="font-bold text-white">RDC</p>
                  <p className="text-white/70 leading-tight">Avenue Bocage 24 bis, Quartier Joli-Parc, Commune de Ngaliema</p>
                  <p className="font-mono text-[11px] text-gold-light">+243 846 823 491</p>
                  <p className="font-mono text-[11px] text-gold-light">+243 855 279 806</p>
                </div>
              </div>
            </div>

          </div>

          {/* Copyright & Légal */}
          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/60">
            <span>© 2026 LAHA ÉDITIONS — LAHAThèque. Tous droits réservés.</span>
            <div className="flex items-center gap-4">
              <Link href="/legal" className="hover:text-gold transition-colors">Mentions légales</Link>
              <span className="text-white/20">|</span>
              <Link href="/cgu" className="hover:text-gold transition-colors">CGU</Link>
              <span className="text-white/20">|</span>
              <Link href="/cgv" className="hover:text-gold transition-colors">CGV</Link>
              <span className="text-white/20">|</span>
              <Link href="/contact" className="hover:text-gold transition-colors">Contact</Link>
            </div>
          </div>

        </div>
      </footer>

      {/* Modale de Contact Support globale */}
      <ContactSupportDialog />

    </div>
  );
}
