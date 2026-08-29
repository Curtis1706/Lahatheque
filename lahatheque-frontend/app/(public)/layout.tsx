"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  ChevronDown, 
  Search, 
  User, 
  ShoppingCart, 
  Globe, 
  BookOpen, 
  HelpCircle,
  Mail
} from "lucide-react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(name);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      
      {/* TopNavBar */}
      <header className="bg-background border-b border-border sticky top-0 z-50 transition-all duration-300">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-[1920px] mx-auto">
          
          {/* 1. Brand Logo (Left) */}
          <Link href="/" className="block w-36 md:w-44 shrink-0">
            <img src="/logo.jpg" alt="LAHATHÈQUE" className="w-full h-auto object-contain" />
          </Link>
          
          {/* 2. Desktop Navigation (Centered) */}
          <nav className="hidden lg:flex items-center justify-center gap-5 xl:gap-8 px-4">
            <Link 
              href="/" 
              className={pathname === "/" 
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap" 
                : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Accueil
            </Link>
            
            <Link 
              href="/about" 
              className={pathname === "/about" 
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap" 
                : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              À propos
            </Link>

            <Link 
              href="/author" 
              className={pathname.startsWith("/author") 
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap" 
                : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Auteur
            </Link>

            <Link 
              href="/university" 
              className={pathname.startsWith("/university") 
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap" 
                : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Partenariat
            </Link>

            <Link 
              href="/subscriptions" 
              className={pathname.startsWith("/subscriptions") 
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap" 
                : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Nos abonnements
            </Link>

            <Link 
              href="/catalog" 
              className={pathname.startsWith("/catalog") 
                ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap" 
                : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
              }
            >
              Catalogue
            </Link>
          </nav>

          {/* 3. Actions & Search (Right) */}
          <div className="flex items-center gap-3 xl:gap-4 shrink-0">
            {/* Search Bar */}
            <div className="hidden md:flex items-center relative">
              <input 
                className="w-48 xl:w-64 h-10 pl-4 pr-10 rounded-full border border-border bg-background-secondary focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 text-sm transition-all duration-200" 
                placeholder="Rechercher..." 
                type="text"
              />
              <button className="absolute right-1 top-1 w-8 h-8 rounded-full bg-navy hover:bg-navy-hover transition-colors flex items-center justify-center text-white" aria-label="Rechercher">
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Connexion Link */}
            <Link href="/login" className="hidden lg:flex items-center gap-2 text-foreground hover:text-navy font-medium text-sm whitespace-nowrap">
              <User className="w-5 h-5 text-gold" /> Connexion
            </Link>

            {/* Cart Icon */}
            <button className="relative p-2 text-foreground hover:text-navy transition-colors shrink-0" aria-label="Panier">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute top-0 right-0 bg-gold text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                0
              </span>
            </button>

            {/* Mobile Menu Burger */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="lg:hidden p-2 text-foreground hover:text-navy transition-colors shrink-0"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-background border-t border-border px-6 py-4 space-y-3 absolute top-full left-0 right-0 shadow-xl z-50">
            <Link 
              href="/" 
              onClick={() => setMobileMenuOpen(false)}
              className={pathname === "/" 
                ? "block font-bold text-navy py-2 border-b border-border text-sm" 
                : "block font-medium text-foreground hover:text-gold py-2 border-b border-border/50 text-sm"
              }
            >
              Accueil
            </Link>
            
            <Link 
              href="/about" 
              onClick={() => setMobileMenuOpen(false)}
              className={pathname === "/about" 
                ? "block font-bold text-navy py-2 border-b border-border text-sm" 
                : "block font-medium text-foreground hover:text-gold py-2 border-b border-border/50 text-sm"
              }
            >
              À propos
            </Link>

            <Link 
              href="/author" 
              onClick={() => setMobileMenuOpen(false)}
              className={pathname.startsWith("/author") 
                ? "block font-bold text-navy py-2 border-b border-border text-sm" 
                : "block font-medium text-foreground hover:text-gold py-2 border-b border-border/50 text-sm"
              }
            >
              Auteur
            </Link>

            <Link 
              href="/university" 
              onClick={() => setMobileMenuOpen(false)}
              className={pathname.startsWith("/university") 
                ? "block font-bold text-navy py-2 border-b border-border text-sm" 
                : "block font-medium text-foreground hover:text-gold py-2 border-b border-border/50 text-sm"
              }
            >
              Partenariat
            </Link>

            <Link 
              href="/subscriptions" 
              onClick={() => setMobileMenuOpen(false)}
              className={pathname.startsWith("/subscriptions") 
                ? "block font-bold text-navy py-2 border-b border-border text-sm" 
                : "block font-medium text-foreground hover:text-gold py-2 border-b border-border/50 text-sm"
              }
            >
              Nos abonnements
            </Link>

            <Link 
              href="/catalog" 
              onClick={() => setMobileMenuOpen(false)}
              className={pathname.startsWith("/catalog") 
                ? "block font-bold text-navy py-2 border-b border-border text-sm" 
                : "block font-medium text-foreground hover:text-gold py-2 border-b border-border/50 text-sm"
              }
            >
              Catalogue
            </Link>

            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 font-medium py-2.5 text-sm text-navy pt-3 border-t border-border"
            >
              <User className="w-4 h-4 text-gold" /> Se connecter
            </Link>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer Component */}
      <footer className="bg-background-secondary border-t border-border">
        <div className="max-w-[1920px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 px-6 md:px-12 xl:px-16 2xl:px-24 py-14">
          
          <div className="md:col-span-5 lg:col-span-5">
            <Link href="/" className="inline-block mb-4 w-36">
              <img src="/logo.jpg" alt="LAHATHÈQUE" className="w-full h-auto object-contain" />
            </Link>
            <p className="text-foreground-muted text-sm max-w-sm mb-6 leading-relaxed">
              La première bibliothèque numérique dédiée aux ouvrages scolaires et universitaires produits par des auteurs et éditeurs africains.
            </p>
          </div>

          <div className="md:col-span-3 lg:col-span-3">
            <h4 className="font-serif font-bold text-navy mb-4 text-base">Navigation</h4>
            <ul className="space-y-3 text-sm text-foreground-muted">
              <li>
                <Link href="/" className="hover:text-navy transition-colors">Accueil</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-navy transition-colors">À propos</Link>
              </li>
              <li>
                <Link href="/catalog" className="hover:text-navy transition-colors">Catalogue</Link>
              </li>
              <li>
                <Link href="/subscriptions" className="hover:text-navy transition-colors">Nos abonnements</Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 lg:col-span-4">
            <h4 className="font-serif font-bold text-navy mb-4 text-base">Espaces &amp; Partenariat</h4>
            <ul className="space-y-3 text-sm text-foreground-muted">
              <li>
                <Link href="/author" className="hover:text-navy transition-colors">Auteur</Link>
              </li>
              <li>
                <Link href="/university" className="hover:text-navy transition-colors">Partenariat</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-navy transition-colors">Aide &amp; Contact</Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-border px-6 md:px-12 py-6 text-center max-w-[1920px] mx-auto text-xs text-foreground-muted flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>© 2026 Lahathèque — Bibliothèque Numérique Panafricaine. Tous droits réservés.</span>
          <div className="flex items-center gap-4">
            <Link href="/legal" className="hover:text-navy transition-colors">Mentions légales</Link>
            <span className="text-border">|</span>
            <Link href="/cgu" className="hover:text-navy transition-colors">CGU</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
