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
          
          <div className="flex items-center gap-4 xl:gap-8">
            <Link href="/" className="block w-40 shrink-0">
              <img src="/logo.jpg" alt="LAHATHÈQUE" className="w-full h-auto object-contain" />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-3 xl:gap-6">
              <Link 
                href="/" 
                className={pathname === "/" 
                  ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap" 
                  : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
                }
              >
                Accueil
              </Link>
              
              <div className="relative">
                <button 
                  onClick={() => toggleDropdown("books")}
                  className={pathname.startsWith("/catalog") && !pathname.includes("cat=")
                    ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 flex items-center gap-1 whitespace-nowrap"
                    : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 flex items-center gap-1 font-medium whitespace-nowrap"
                  }
                >
                  Livres universitaires <ChevronDown className="w-4 h-4 shrink-0" />
                </button>
                {activeDropdown === "books" && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-background-secondary border border-border rounded shadow-lg py-2 z-50">
                    <Link href="/catalog?type=cours" className="block px-4 py-2 text-sm hover:bg-neutral-warm-200/50">Cours & Manuels</Link>
                    <Link href="/catalog?type=theses" className="block px-4 py-2 text-sm hover:bg-neutral-warm-200/50">Thèses & Mémoires</Link>
                    <Link href="/catalog?type=articles" className="block px-4 py-2 text-sm hover:bg-neutral-warm-200/50">Articles Scientifiques</Link>
                  </div>
                )}
              </div>

              <div className="relative">
                <button 
                  onClick={() => toggleDropdown("categories")}
                  className={pathname.includes("cat=")
                    ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 flex items-center gap-1 whitespace-nowrap"
                    : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 flex items-center gap-1 font-medium whitespace-nowrap"
                  }
                >
                  Catégories <ChevronDown className="w-4 h-4 shrink-0" />
                </button>
                {activeDropdown === "categories" && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-background-secondary border border-border rounded shadow-lg py-2 z-50">
                    <Link href="/catalog?cat=droit" className="block px-4 py-2 text-sm hover:bg-neutral-warm-200/50">Droit</Link>
                    <Link href="/catalog?cat=economie" className="block px-4 py-2 text-sm hover:bg-neutral-warm-200/50">Économie</Link>
                    <Link href="/catalog?cat=compta" className="block px-4 py-2 text-sm hover:bg-neutral-warm-200/50">Gestion & Comptabilité</Link>
                    <Link href="/catalog?cat=sciences" className="block px-4 py-2 text-sm hover:bg-neutral-warm-200/50">Sciences & Médecine</Link>
                  </div>
                )}
              </div>

              <div className="relative">
                <button 
                  onClick={() => toggleDropdown("universities")}
                  className={pathname.startsWith("/universities")
                    ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 flex items-center gap-1 whitespace-nowrap"
                    : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 flex items-center gap-1 font-medium whitespace-nowrap"
                  }
                >
                  Universités <ChevronDown className="w-4 h-4 shrink-0" />
                </button>
                {activeDropdown === "universities" && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-background-secondary border border-border rounded shadow-lg py-2 z-50">
                    <Link href="/universities/abomey" className="block px-4 py-2 text-sm hover:bg-neutral-warm-200/50">UAC (Bénin)</Link>
                    <Link href="/universities/lome" className="block px-4 py-2 text-sm hover:bg-neutral-warm-200/50">UL (Togo)</Link>
                    <Link href="/universities/cocody" className="block px-4 py-2 text-sm hover:bg-neutral-warm-200/50">UFHB (Côte d'Ivoire)</Link>
                    <Link href="/universities/dakar" className="block px-4 py-2 text-sm hover:bg-neutral-warm-200/50">UCAD (Sénégal)</Link>
                  </div>
                )}
              </div>

              <Link 
                href="/authors" 
                className={pathname === "/authors" 
                  ? "text-navy font-bold border-b-2 border-gold font-sans text-sm py-2 whitespace-nowrap" 
                  : "text-foreground hover:text-gold transition-colors duration-200 text-sm py-2 font-medium whitespace-nowrap"
                }
              >
                Auteurs
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
            </nav>
          </div>

          <div className="flex items-center gap-3 xl:gap-4 shrink-0">
            {/* Search Bar */}
            <div className="hidden md:flex items-center relative">
              <input 
                className="w-48 xl:w-64 h-10 pl-4 pr-10 rounded-full border border-border bg-background-secondary focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 text-sm transition-all duration-200" 
                placeholder="Rechercher..." 
                type="text"
              />
              <button className="absolute right-1 top-1 w-8 h-8 rounded-full bg-navy hover:bg-navy-hover transition-colors flex items-center justify-center text-white">
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Connexion Link */}
            <Link href="/login" className="hidden lg:flex items-center gap-2 text-foreground hover:text-navy font-medium text-sm whitespace-nowrap">
              <User className="w-5 h-5 text-gold" /> Connexion
            </Link>

            {/* Cart Icon */}
            <button className="relative p-2 text-foreground hover:text-navy transition-colors shrink-0">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute top-0 right-0 bg-gold text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                0
              </span>
            </button>

            {/* Mobile Menu Burger */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="lg:hidden p-2 text-foreground hover:text-navy transition-colors shrink-0"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-background border-t border-border px-6 py-4 space-y-4 absolute top-full left-0 right-0 shadow-xl z-50">
            <Link 
              href="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="block font-bold text-navy py-2 border-b border-border"
            >
              Accueil
            </Link>
            
            <div className="space-y-1">
              <button 
                onClick={() => toggleDropdown("mobile-books")}
                className="w-full text-left font-medium py-2 flex justify-between items-center text-sm"
              >
                Livres universitaires <ChevronDown className="w-4 h-4" />
              </button>
              {activeDropdown === "mobile-books" && (
                <div className="pl-4 space-y-2 py-1 text-sm text-foreground-muted">
                  <Link href="/catalog?type=cours" onClick={() => setMobileMenuOpen(false)} className="block py-1">Cours & Manuels</Link>
                  <Link href="/catalog?type=theses" onClick={() => setMobileMenuOpen(false)} className="block py-1">Thèses & Mémoires</Link>
                  <Link href="/catalog?type=articles" onClick={() => setMobileMenuOpen(false)} className="block py-1">Articles</Link>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <button 
                onClick={() => toggleDropdown("mobile-categories")}
                className="w-full text-left font-medium py-2 flex justify-between items-center text-sm"
              >
                Catégories <ChevronDown className="w-4 h-4" />
              </button>
              {activeDropdown === "mobile-categories" && (
                <div className="pl-4 space-y-2 py-1 text-sm text-foreground-muted">
                  <Link href="/catalog?cat=droit" onClick={() => setMobileMenuOpen(false)} className="block py-1">Droit</Link>
                  <Link href="/catalog?cat=economie" onClick={() => setMobileMenuOpen(false)} className="block py-1">Économie</Link>
                  <Link href="/catalog?cat=compta" onClick={() => setMobileMenuOpen(false)} className="block py-1">Gestion & Comptabilité</Link>
                </div>
              )}
            </div>

            <Link 
              href="/authors" 
              onClick={() => setMobileMenuOpen(false)}
              className="block font-medium py-2 text-sm"
            >
              Auteurs
            </Link>
            
            <Link 
              href="/about" 
              onClick={() => setMobileMenuOpen(false)}
              className="block font-medium py-2 text-sm"
            >
              À propos
            </Link>

            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 font-medium py-2 text-sm text-navy"
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
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-6 md:px-10 py-12">
          
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block mb-4 w-32">
              <img src="/logo.jpg" alt="LAHATHÈQUE" className="w-full h-auto object-contain" />
            </Link>
            <p className="text-foreground-muted text-sm max-w-sm mb-6">
              La première bibliothèque numérique dédiée aux ouvrages scolaires et universitaires produits par des auteurs et éditeurs africains.
            </p>
          </div>

          <div>
            <h4 className="font-serif font-bold text-navy mb-4 text-base">Découvrir</h4>
            <ul className="space-y-3 text-sm text-foreground-muted">
              <li>
                <Link href="/about" className="hover:text-navy transition-colors">Qui sommes-nous ?</Link>
              </li>
              <li>
                <Link href="/catalog" className="hover:text-navy transition-colors">Catalogue</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-navy transition-colors">Tarifs &amp; Abonnements</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-navy mb-4 text-base">Ressources</h4>
            <ul className="space-y-3 text-sm text-foreground-muted">
              <li>
                <Link href="/universities" className="hover:text-navy transition-colors">Espace Universités</Link>
              </li>
              <li>
                <Link href="/submit" className="hover:text-navy transition-colors">Soumettre un manuscrit</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-navy transition-colors">Aide &amp; Contact</Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-border px-6 py-6 text-center max-w-7xl mx-auto text-xs text-foreground-muted">
          © 2026 Lahathèque - Bibliothèque Numérique Panafricaine. Tous droits réservés. |{" "}
          <Link href="/legal" className="hover:text-navy transition-colors">Mentions légales</Link> |{" "}
          <Link href="/cgu" className="hover:text-navy transition-colors">CGU</Link>
        </div>
      </footer>

    </div>
  );
}
